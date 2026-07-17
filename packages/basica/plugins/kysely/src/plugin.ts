import { AppRequiredDeps, LifecycleManagerBuilder } from "@basica/core";
import { Plugin, RegistersService } from "@basica/core/utils";

import { Migrator } from "./migrator";

import { Kysely } from "kysely";
import {
  FileMigrationProvider,
  MigrationProvider,
  MigratorProps,
} from "kysely/migration";

import fs from "node:fs/promises";
import path from "node:path";

class KyselyLifecyclePlugin<D extends AppRequiredDeps> {
  #lifecycle: LifecycleManagerBuilder<D>;

  constructor(lifecycle: LifecycleManagerBuilder<D>) {
    this.#lifecycle = lifecycle;
  }

  /**
   * Registers kysely migrator in the application lifecycle
   * @param name
   * @param db
   * @param provider
   * @param options
   * @param migrator
   * @example
   * builder.addKyselyMigrations(
   *   "migrations",
   *   deps.db,
   *   path.join(__dirname, "./migrations")
   * )
   * @example
   * builder.addKyselyMigrations(
   *   "migrations",
   *   deps.db,
   *   path.join(__dirname, "./migrations"),
   *   { migrationTableName: "migrations" }
   * )
   * @example
   * builder.addKyselyMigrations(
   *   "migrations",
   *   deps.db,
   *    new FileMigrationProvider({
   *      migrationFolder: path.join(__dirname, "./migrations"),
   *      path,
   *      fs,
   *    })
   * )
   * @example
   * builder.addKyselyMigrations(
   *   "migrations",
   *   deps.db,
   *    new FileMigrationProvider({
   *      migrationFolder: path.join(__dirname, "./migrations"),
   *      path,
   *      fs,
   *    }),
   *   { migrationTableName: "migrations" }
   * )
   * @example
   * builder.addKyselyMigrations(
   *   "migrations",
   *   new Migrator(
   *     {
   *       db: deps.db,
   *       provider: new FileMigrationProvider({
   *         migrationFolder: path.join(__dirname, "./migrations"),
   *         path,
   *         fs,
   *       }),
   *     },
   *     deps.logger
   *   )
   * )
   */
  addKyselyMigrations<const K extends string>(
    name: K,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: Kysely<any>,
    provider: string | MigrationProvider,
    options?: Omit<MigratorProps, "provider" | "db">,
  ): this & RegistersService<K, Migrator>;
  addKyselyMigrations<const K extends string>(
    name: K,
    migrator: Migrator,
  ): this & RegistersService<K, Migrator>;
  addKyselyMigrations(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbOrMigrator: Kysely<any> | Migrator,
    provider: string | MigrationProvider = "",
    options: Omit<MigratorProps, "provider" | "db"> = {},
  ) {
    const migrator =
      dbOrMigrator instanceof Migrator
        ? dbOrMigrator
        : new Migrator(
            {
              db: dbOrMigrator,
              provider:
                typeof provider === "string"
                  ? new FileMigrationProvider({
                      migrationFolder: provider,
                      fs,
                      path,
                    })
                  : provider,
              ...options,
            },
            this.#lifecycle.deps.logger,
            name,
          );

    this.#lifecycle.addService(name, () => migrator);

    return this as this & RegistersService<string, Migrator>;
  }
}

/** Kysely lifecycle plugin */
export const lifecyclePlugin = (<D extends AppRequiredDeps>(
  base: LifecycleManagerBuilder<D>,
) => new KyselyLifecyclePlugin<D>(base)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredDeps>
>;
