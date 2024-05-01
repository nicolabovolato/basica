import { IHealthcheck, IShutdown } from "@basica/core";
import { ILogger } from "@basica/core/logger";

import { Pool as PgPool } from "pg";
import { PoolConfig, getPoolConfig } from "./config";

/** Postgres Pool */
export class Pool extends PgPool implements IShutdown, IHealthcheck {
  readonly #logger: ILogger;

  /**
   * @param config {@link PoolConfig}
   * @param logger {@link ILogger}
   * @param name unique name
   * @example
   * new Pool(
   *   {
   *     connectionString: "postgres://localhost:5432"
   *     connectionTimeoutMillis: 5000
   *   },
   *   deps.logger
   * )
   * @example
   * new Pool(
   *   {
   *     connectionString: "postgres://localhost:5432"
   *     connectionTimeoutMillis: 5000
   *   },
   *   deps.logger,
   *   "db"
   * )
   */
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
