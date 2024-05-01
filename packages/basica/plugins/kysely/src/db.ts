import { IHealthcheck, IShutdown } from "@basica/core";
import { ILogger } from "@basica/core/logger";
import { KyselyConfig, Kysely as KyselyDatabase, sql } from "kysely";

/** Kysely database */
export class Kysely<T>
  extends KyselyDatabase<T>
  implements IShutdown, IHealthcheck
{
  readonly #logger: ILogger;

  /**
   * @param config {@link KyselyConfig}
   * @param logger {@link ILogger}
   * @param name unique name
   * @example
   * new Kysely<DB>(
   *   {
   *     dialect: new PostgreSqlDialect({
   *       pool: new Pool({ connectionString: "postgres://localhost:5432" })
   *     })
   *   },
   *   deps.logger
   * )
   * @example
   * new Kysely<DB>(
   *   {
   *     dialect: new PostgreSqlDialect({
   *       pool: new Pool({ connectionString: "postgres://localhost:5432" })
   *     })
   *   },
   *   deps.logger,
   *   "db"
   * )
   */
  constructor(config: KyselyConfig, logger: ILogger);
  constructor(config: KyselyConfig, logger: ILogger, name: string);
  constructor(config: KyselyConfig, _logger: ILogger, name?: string) {
    const logger = name
      ? _logger.child({
          name: `@basica:service:kysely:${name}`,
        })
      : _logger;

    super({
      log: (e) => {
        if (e.level === "error") {
          logger.error(e.error, "Kysely error");
        } else if (e.level === "query") {
          logger.debug(
            { query: e.query, queryDurationMillis: e.queryDurationMillis },
            "Kysely query"
          );
        }
      },
      ...config,
    });
    this.#logger = logger;
  }

  async healthcheck() {
    await sql`SELECT 1`.execute(this);
    return {
      status: "healthy",
    } as const;
  }

  async shutdown() {
    await super.destroy();
  }
}
