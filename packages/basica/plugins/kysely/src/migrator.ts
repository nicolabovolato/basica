import { IStartup } from "@basica/core";
import { ILogger } from "@basica/core/logger";

import { Migrator as KyselyMigrator, MigratorProps } from "kysely";

/** Kysely migrator */
export class Migrator extends KyselyMigrator implements IStartup {
  #logger: ILogger;

  /**
   * @param props {@link MigratorProps}
   * @param logger {@link ILogger}
   * @param name unique name
   * @example
   * new Migrator(
   *   {
   *     db: services.db,
   *     provider: new FileMigrationProvider({
   *       migrationFolder: path.join(__dirname, "./migrations"),
   *       path,
   *       fs,
   *     }),
   *   },
   *   services.logger
   * )
   * @example
   * new Migrator(
   *   {
   *     db: services.db,
   *     provider: new FileMigrationProvider({
   *       migrationFolder: path.join(__dirname, "./migrations"),
   *       path,
   *       fs,
   *     }),
   *   },
   *   services.logger,
   *   "migrations"
   * )
   */
  constructor(props: MigratorProps, logger: ILogger);
  constructor(props: MigratorProps, logger: ILogger, name: string);
  constructor(props: MigratorProps, logger: ILogger, name?: string) {
    super(props);
    this.#logger = name
      ? logger.child({
          name: `@basica:entrypoint:kysely:migrator:${name}`,
        })
      : logger;
  }

  async start() {
    const { error, results } = await super.migrateToLatest();
    results?.forEach((result) => {
      const msg = `migration ${result.migrationName} (${result.direction}) status ${result.status}`;
      result.status == "Error"
        ? this.#logger.error(result, msg)
        : this.#logger.info(result, msg);
    });
    if (error) {
      this.#logger.error(error, "Failed to apply migrations");
      throw error;
    }
  }
}
