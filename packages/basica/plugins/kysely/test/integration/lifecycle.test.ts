import { AppBuilder } from "@basica/core";
import { loggerFactory } from "@basica/core/logger";
import Sqlite from "better-sqlite3";
import { SqliteDialect } from "kysely";
import { expect, test } from "vitest";

import { Kysely } from "src/db";
import { lifecyclePlugin as kyselyLifecyclePlugin } from "src/plugin";

test("app.lifecycle.start()/stop() with a kysely db + migrations", async () => {
  const db = new Kysely(
    { dialect: new SqliteDialect({ database: new Sqlite(":memory:") }) },
    loggerFactory({ level: "silent" }),
    "test",
  );

  const app = AppBuilder.registerDependencies((di) =>
    di
      .addSingleton("logger", () => loggerFactory({ level: "silent" }))
      .addSingleton("db", () => db),
  )
    .configureLifecycle((builder, deps) =>
      builder
        .addService("db", () => deps.db)
        .with(kyselyLifecyclePlugin, (b) =>
          b.addKyselyMigrations(
            "migrations",
            deps.db,
            __dirname + "/migrator/migrations",
          ),
        ),
    )
    .build();

  const started = await app.lifecycle.start();
  const stopped = await app.lifecycle.stop();

  expect(started).toBe(true);
  expect(stopped).toBe(true);
});
