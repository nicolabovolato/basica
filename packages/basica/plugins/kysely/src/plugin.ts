import { AppRequiredDeps, LifecycleManagerBuilder } from "@basica/core";
import { Plugin } from "@basica/core/utils";

import { Migrator } from "./migrator";

import {
  FileMigrationProvider,
  Kysely,
  MigrationProvider,
  MigratorProps,
} from "kysely";

import fs from "node:fs/promises";
import path from "node:path";

class KyselyLifecyclePlugin<S extends AppRequiredDeps> {
  #lifecycle: LifecycleManagerBuilder<S>;

  constructor(lifecycle: LifecycleManagerBuilder<S>) {
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
  addKyselyMigrations<Db>(
    name: string,
    db: Kysely<Db>,
    provider: string | MigrationProvider,
    options?: Omit<MigratorProps, "provider" | "db">
  ): this;
  addKyselyMigrations(name: string, migrator: Migrator): this;
  addKyselyMigrations<Db>(
    name: string,
    dbOrMigrator: Kysely<Db> | Migrator,
    provider: string | MigrationProvider = "",
    options: Omit<MigratorProps, "provider" | "db"> = {}
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
            name
          );

    this.#lifecycle.addService(name, () => migrator);

    return this;
  }
}

/** Kysely lifecycle plugin */
export const lifecyclePlugin = (<S extends AppRequiredDeps>(
  base: LifecycleManagerBuilder<S>
) => new KyselyLifecyclePlugin(base)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredDeps>
>;
