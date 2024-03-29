import { IHealthcheck, IShutdown } from "@basica/core";
import { ILogger } from "@basica/core/logger";

import { Pool as PgPool } from "pg";
import { PoolConfig, getPoolConfig } from "./config";

export class Pool extends PgPool implements IShutdown, IHealthcheck {
  readonly #logger: ILogger;

  constructor(config: PoolConfig, logger: ILogger);
  constructor(config: PoolConfig, logger: ILogger, name: string);
  constructor(config: PoolConfig, _logger: ILogger, name?: string) {
    const logger = name
      ? _logger.child({
          name: `@basica:service:pg:${name}`,
        })
      : _logger;

    super(getPoolConfig(config));
    this.#logger = logger;

    super.on("error", (e) => this.#logger.error(e, "pg error"));
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