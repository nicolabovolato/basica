import { IHealthcheck, IShutdown, IStartup } from "@basica/core";
import { ILogger } from "@basica/core/logger";

import amqp, {
  AmqpConnectionManager,
  AmqpConnectionManagerOptions,
  ChannelWrapper,
  CreateChannelOpts,
} from "amqp-connection-manager";

import { AMQPClientConfig } from "./config";

/** AMQP Client */
export class AMQPClient implements IStartup, IShutdown, IHealthcheck {
  connection: AmqpConnectionManager;
  #logger: ILogger;

  /**
   *
   * @param urls @see {@link AmqpConnectionManager#connect}
   * @param opts @see {@link AmqpConnectionManager#connect}
   * @param config amqp client {@link ClusterWrapperConfig config}
   * @param logger {@link ILogger}
   * @param name service name
   * @example
   * const client = new AMQPClient(
   *  { urls: "redis://127.0.0.1:6379", heartbeatIntervalInSeconds: 5 },
   *  logger
   * )
   * @example
   * const client = new AMQPClient(
   *  { urls: "redis://127.0.0.1:6379", heartbeatIntervalInSeconds: 5 },
   *  logger,
   *  "client"
   * )
   * @example
   * const client = new AMQPClient(
   *  "redis://127.0.0.1:6379",
   *  { heartbeatIntervalInSeconds: 5 },
   *  logger,
   *  "client"
   * )
   */
  constructor(
    urls: string | string[],
    opts: AmqpConnectionManagerOptions,
    logger: ILogger,
    name?: string
  );
  constructor(config: AMQPClientConfig, logger: ILogger, name?: string);
  constructor(
    urlsOrConfig: string | string[] | AMQPClientConfig,
    optsOrLogger: AmqpConnectionManagerOptions | ILogger,
    loggerOrMaybeName?: ILogger | string,
    maybeName?: string
  ) {
    const urls =
      typeof urlsOrConfig == "string" || Array.isArray(urlsOrConfig)
        ? urlsOrConfig
        : undefined;
    const config = urls ? undefined : (urlsOrConfig as AMQPClientConfig);
    const logger =
      "info" in optsOrLogger ? optsOrLogger : (loggerOrMaybeName as ILogger);
    const opts =
      "info" in optsOrLogger
        ? undefined
        : (optsOrLogger as AmqpConnectionManagerOptions);
    const name =
      typeof loggerOrMaybeName == "string" ? loggerOrMaybeName : maybeName;

    this.#logger = name
      ? logger.child({
          name: `@basica:service:amqp:client:${name}`,
        })
      : logger;

    if (config) {
      const { urls, ...opts } = config as {
        url?: string;
        urls?: string[];
      } & AMQPClientConfig;
      this.connection = amqp.connect(urls, opts);
    } else {
      this.connection = amqp.connect(urls, opts);
    }

    this.connection.on("connectFailed", ({ err }) =>
      this.#logger.error(err, "Failed to connect to AMQP broker")
    );
    this.connection.on("disconnect", ({ err }) =>
      this.#logger.warn(err, "Disconnected from AMQP broker")
    );
    this.connection.on("blocked", (err) =>
      this.#logger.warn(err, "Connection blocked")
    );
    this.connection.on("unblocked", () =>
      this.#logger.info("Connection unblocked")
    );
  }

  async start() {
    await this.connection.connect({
      timeout: this.connection.heartbeatIntervalInSeconds * 1000,
    });
  }

  async shutdown() {
    await this.connection.close();
  }

  async healthcheck() {
    if (this.connection.isConnected()) {
      return {
        status: "healthy",
      } as const;
    }
    return {
      status: "unhealthy",
      description: "Client is not connected",
    } as const;
  }

  /** @see {@link AmqpConnectionManager.createChannel} */
  createChannel(options?: CreateChannelOpts): ChannelWrapper {
    return this.connection.createChannel({
      json: true,
      publishTimeout: this.connection.heartbeatIntervalInSeconds * 1000,
      ...options,
    });
  }
}
