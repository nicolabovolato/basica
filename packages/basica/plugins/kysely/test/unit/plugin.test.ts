import { LifecycleManagerBuilder } from "@basica/core";
import { lifecyclePlugin } from "src/plugin";
import { beforeEach, expect, test, vi } from "vitest";
import { FileMigrationProvider, SqliteDialect } from "kysely";
import Sqlite from "better-sqlite3";

import { hcManager, logger, services } from "./utils";
import { Kysely } from "src/db";
import { Migrator } from "src/migrator";

import fs from "node:fs/promises";
import path from "node:path";

const kysely = new Kysely(
  {
    dialect: new SqliteDialect({
      database: new Sqlite(":memory:"),
    }),
  },
  logger
);

beforeEach(() => {
  vi.restoreAllMocks();
});

test("addKyselyMigrations", async () => {
  const builder = new LifecycleManagerBuilder(services, hcManager);
  vi.spyOn(builder, "addService");

  builder.with(lifecyclePlugin, (builder) =>
    builder
      .addKyselyMigrations("test", kysely, "migrationsFolder")
      .addKyselyMigrations("test", kysely, "migrationsFolder", {})
      .addKyselyMigrations(
        "test",
        kysely,
        new FileMigrationProvider({
          migrationFolder: "migrations",
          path,
          fs,
        })
      )
      .addKyselyMigrations(
        "test",
        kysely,
        new FileMigrationProvider({
          migrationFolder: "migrations",
          path,
          fs,
        }),
        {}
      )
      .addKyselyMigrations(
        "test",
        new Migrator(
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            db: kysely as Kysely<any>,
            provider: new FileMigrationProvider({
              migrationFolder: "migrations",
              path,
              fs,
            }),
          },
          logger
        )
      )
  );

  expect(builder.addService).toHaveBeenCalledTimes(5);
  for (const [name, fn] of vi.mocked(builder.addService).mock.calls) {
    expect(name).toBe("test");
    expect(fn(services)).toBeInstanceOf(Migrator);
  }
});

test.todo("plugin (type tests?)"); // TODO: test plugin
