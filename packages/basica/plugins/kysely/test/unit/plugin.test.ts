import { LifecycleManagerBuilder } from "@basica/core";
import Sqlite from "better-sqlite3";
import { SqliteDialect } from "kysely";
import { FileMigrationProvider } from "kysely/migration";
import { lifecyclePlugin } from "src/plugin";
import { beforeEach, expect, expectTypeOf, test, vi } from "vitest";

import { Kysely } from "src/db";
import { Migrator } from "src/migrator";
import { deps, logger } from "./utils";

import fs from "node:fs/promises";
import path from "node:path";

const kysely = new Kysely(
  {
    dialect: new SqliteDialect({
      database: new Sqlite(":memory:"),
    }),
  },
  logger,
);

beforeEach(() => {
  vi.restoreAllMocks();
});

const fileProvider = () =>
  new FileMigrationProvider({ migrationFolder: "migrations", path, fs });

test("addKyselyMigrations(db, provider) registers & announces the migrator service", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addService");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addKyselyMigrations("test", kysely, "migrationsFolder"),
  );

  expect(builder.addService).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addService).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps)).toBeInstanceOf(Migrator);

  expectTypeOf(app.services.test).toEqualTypeOf<Migrator>();
});

test("addKyselyMigrations(migrator) registers & announces the migrator service", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addService");

  const migrator = new Migrator(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { db: kysely as Kysely<any>, provider: fileProvider() },
    logger,
  );

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addKyselyMigrations("test", migrator),
  );

  expect(builder.addService).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addService).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps)).toBeInstanceOf(Migrator);

  expectTypeOf(app.services.test).toEqualTypeOf<Migrator>();
});

test.each([
  ["string path", "migrationsFolder", undefined],
  ["string path + options", "migrationsFolder", {}],
  ["FileMigrationProvider", fileProvider(), undefined],
  ["FileMigrationProvider + options", fileProvider(), {}],
] as const)(
  "addKyselyMigrations builds a Migrator from a %s",
  (_desc, provider, options) => {
    const builder = new LifecycleManagerBuilder(deps);
    vi.spyOn(builder, "addService");

    builder.with(lifecyclePlugin, (b) =>
      b.addKyselyMigrations("test", kysely, provider, options),
    );

    expect(builder.addService).toHaveBeenCalledOnce();
    expect(vi.mocked(builder.addService).mock.calls[0][1](deps)).toBeInstanceOf(
      Migrator,
    );
  },
);
