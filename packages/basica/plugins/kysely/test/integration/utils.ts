import { loggerFactory } from "@basica/core/logger";

import Sqlite from "better-sqlite3";
import { SqliteDialect } from "kysely";

import { Kysely } from "src/db";

export const getKyselyInstance = (createUsers = true) => {
  const db = new Sqlite(":memory:");

  if (createUsers) {
    db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)").exec(
      "INSERT INTO users VALUES (1, 'Alice'),(2, 'Bob')"
    );
  }

  return new Kysely(
    {
      dialect: new SqliteDialect({
        database: db,
      }),
    },
    loggerFactory({ level: "silent" }),
    "test"
  );
};
