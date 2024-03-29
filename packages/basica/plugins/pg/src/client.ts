import { IHealthcheck, IShutdown, IStartup } from "@basica/core";
import { ILogger } from "@basica/core/logger";

import { Client as PgClient } from "pg";
import { ClientConfig, getClientConfig } from "./config";

export class Client
  extends PgClient
  implements IStartup, IShutdown, IHealthcheck
{
  readonly #logger: ILogger;

  constructor(config: ClientConfig, logger: ILogger);
  constructor(config: ClientConfig, logger: ILogger, name: string);
  constructor(config: ClientConfig, _logger: ILogger, name?: string) {
    const logger = name
      ? _logger.child({
          name: `@basica:service:pg:${name}`,
        })
      : _logger;

    super(getClientConfig(config));
    this.#logger = logger;

    super.on("error", (e) => this.#logger.error(e, "pg error"));
  }

  async start() {
    await super.connect();
  }

  async healthcheck() {
    await super.query(`SELECT 1`);
    return {
      status: "healthy",
    } as const;
  }

  async shutdown() {
    await super.end();
  }
}
