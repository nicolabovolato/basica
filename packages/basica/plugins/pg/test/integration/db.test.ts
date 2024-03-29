import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";

import { getClientInstance, getPoolInstance } from "./utils";

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
}, 60000);

beforeEach(async () => {
  await container.exec(
    [
      "psql",
      "-U",
      container.getUsername(),
      "-d",
      container.getDatabase(),
      "-c",
      "CREATE TABLE users(id SERIAL PRIMARY KEY, name TEXT); INSERT INTO users(name) VALUES ('Alice'), ('Bob');",
    ],
    {
      env: {
        PGPASSWORD: container.getPassword(),
      },
    }
  );
});

afterEach(async () => {
  await container.exec(
    [
      "psql",
      "-U",
      container.getUsername(),
      "-d",
      container.getDatabase(),
      "-c",
      "DROP TABLE users;",
    ],
    {
      env: {
        PGPASSWORD: container.getPassword(),
      },
    }
  );
});

afterAll(async () => {
  await container.stop();
});

describe("client", () => {
  test("start", async () => {
    const pg = getClientInstance(container);

    await pg.start();
  });

  test("healthcheck", async () => {
    const pg = getClientInstance(container);
    await pg.start();

    const result = await pg.healthcheck();
    expect(result).toEqual({ status: "healthy" });
  });

  test("query", async () => {
    const pg = getClientInstance(container);
    await pg.start();

    const result = await pg.query(`SELECT * FROM users`);
    expect(result.rows).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });

  test("shutdown", async () => {
    const pg = getClientInstance(container);
    await pg.start();

    await pg.shutdown();
    await expect(pg.query(`SELECT * FROM users`)).rejects.toThrowError();
  });
});

describe("pool", () => {
  test("healthcheck", async () => {
    const pg = getPoolInstance(container);

    const result = await pg.healthcheck();
    expect(result).toEqual({ status: "healthy" });
  });

  test("query", async () => {
    const pg = getPoolInstance(container);
    const result = await pg.query(`SELECT * FROM users`);
    expect(result.rows).toEqual([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
  });

  test("shutdown", async () => {
    const pg = getPoolInstance(container);

    await pg.shutdown();
    await expect(pg.query(`SELECT * FROM users`)).rejects.toThrowError();
  });
});
