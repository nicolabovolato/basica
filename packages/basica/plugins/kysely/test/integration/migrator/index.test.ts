import { loggerFactory } from "@basica/core/logger";
import { expect, test } from "vitest";
import { getKyselyInstance } from "../utils";
import { Migrator } from "src/migrator";
import { FileMigrationProvider, Kysely, sql } from "kysely";

import fs from "fs/promises";
import path from "path";

const getMigrator = (kysely: Kysely<unknown>) => {
  return new Migrator(
    {
      db: kysely,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: __dirname + "/migrations",
      }),
    },
    loggerFactory({ level: "silent" }),
    "test"
  );
};

test("start", async () => {
  const kysely = getKyselyInstance(false);
  const migrator = getMigrator(kysely);
  await migrator.start();

  await expect(sql`SELECT * FROM users`.execute(kysely)).resolves.toEqual({
    rows: [],
  });
});
