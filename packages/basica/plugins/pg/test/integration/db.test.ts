import { Client } from "pg";
import { afterEach, beforeEach, describe, expect, inject, test } from "vitest";

import { getClientInstance, getPoolInstance } from "./utils";

const pgUrl = inject("pgUrl");

const runSql = async (sql: string) => {
  const client = new Client(pgUrl);
  await client.connect();
  await client.query(sql);
  await client.end();
};

beforeEach(async () => {
  await runSql(
    "CREATE TABLE users(id SERIAL PRIMARY KEY, name TEXT); INSERT INTO users(name) VALUES ('Alice'), ('Bob');",
  );
});

afterEach(async () => {
  await runSql("DROP TABLE users;");
});

describe("client", () => {
  test("start", async () => {
    const pg = getClientInstance(pgUrl);

    await pg.start();
  });

  test("healthcheck", async () => {
    const pg = getClientInstance(pgUrl);
    await pg.start();

    const result = await pg.healthcheck();
    expect(result).toEqual({ status: "healthy" });
  });

  test("query", async () => {
    const pg = getClientInstance(pgUrl);
    await pg.start();

    const result = await pg.query(`SELECT * FROM users`);
    expect(result.rows).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });

  test("shutdown", async () => {
    const pg = getClientInstance(pgUrl);
    await pg.start();

    await pg.shutdown();
    await expect(pg.query(`SELECT * FROM users`)).rejects.toThrowError();
  });
});

describe("pool", () => {
  test("healthcheck", async () => {
    const pg = getPoolInstance(pgUrl);

    const result = await pg.healthcheck();
    expect(result).toEqual({ status: "healthy" });
  });

  test("query", async () => {
    const pg = getPoolInstance(pgUrl);
    const result = await pg.query(`SELECT * FROM users`);
    expect(result.rows).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });

  test("shutdown", async () => {
    const pg = getPoolInstance(pgUrl);

    await pg.shutdown();
    await expect(pg.query(`SELECT * FROM users`)).rejects.toThrowError();
  });
});
