import { AppRequiredServices, LifecycleManagerBuilder } from "@basica/core";
import { Plugin } from "@basica/core/utils";

import { AMQPClient } from "../client";
import { AMQPClientConfig } from "../config";
import { AMQPQueueConsumerEntrypoint, EntrypointConfig } from "./entrypoint";

class AMQPLifecyclePlugin<S extends AppRequiredServices> {
  readonly #lifecycle: LifecycleManagerBuilder<S>;
  constructor(lifecycle: LifecycleManagerBuilder<S>) {
    this.#lifecycle = lifecycle;
  }

  /**
   * Istantiates a channel that consumes a given queue and registers it in the application lifecycle
   * If no amqp client instance is provided, an amqp client service will be registered in the application lifecycle
   * @param name entrypoint name
   * @param client amqp client {@link AMQPClient}
   * @param clientConfig amqp client config {@link AMQPClientConfig}
   * @param config config {@link EntrypointConfig}
   * @example
   * builder.addAMQPConsumer("consumer", services.client, {
   *   handler: async () => {
   *     //...
   *   },
   *   queueName: "test",
   * })
   * @example
   * builder.addAMQPConsumer("consumer",
   *   {
   *     url: "amqp://localhost:5672",
   *     heartbeatIntervalInSeconds: 5,
   *   },
   *   {
   *     queueName: "test",
   *     handler: async () => {
   *       //...
   *     },
   *   }
   * })
   */
  addAMQPConsumer(
    name: string,
    clientConfig: AMQPClientConfig,
    config: EntrypointConfig
  ): this;
  addAMQPConsumer(
    name: string,
    client: AMQPClient,
    config: EntrypointConfig
  ): this;
  addAMQPConsumer(
    name: string,
    clientOrClientConfig: AMQPClientConfig | AMQPClient,
    config: EntrypointConfig
  ) {
    let client =
      clientOrClientConfig instanceof AMQPClient
        ? clientOrClientConfig
        : undefined;

    if (!client) {
      client = new AMQPClient(
        clientOrClientConfig as AMQPClientConfig,
        this.#lifecycle.services.logger,
        `consumer:${name}`
      );

      this.#lifecycle.addService(
        `amqp:client:${name}`,
        () => client as AMQPClient
      );
    }

    this.#lifecycle.addEntrypoint(
      name,
      (services) =>
        new AMQPQueueConsumerEntrypoint(
          name,
          client as AMQPClient,
          services.logger,
          config
        )
    );

    return this;
  }
}

/** AMQP lifecycle plugin */
export const lifecyclePlugin = (<S extends AppRequiredServices>(
  lifecycle: LifecycleManagerBuilder<S>
) => new AMQPLifecyclePlugin(lifecycle)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredServices>
>;
