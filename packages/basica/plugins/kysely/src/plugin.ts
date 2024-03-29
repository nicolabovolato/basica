import { AppRequiredServices, LifecycleManagerBuilder } from "@basica/core";
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

class KyselyLifecyclePlugin<S extends AppRequiredServices> {
  #lifecycle: LifecycleManagerBuilder<S>;

  constructor(lifecycle: LifecycleManagerBuilder<S>) {
    this.#lifecycle = lifecycle;
  }

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
            this.#lifecycle.services.logger,
            name
          );

    this.#lifecycle.addService(name, () => migrator);

    return this;
  }
}

export const lifecyclePlugin = (<S extends AppRequiredServices>(
  base: LifecycleManagerBuilder<S>
) => new KyselyLifecyclePlugin(base)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredServices>
>;
