import { expect, test } from "vitest";

import { sql } from "kysely";

import { getKyselyInstance } from "./utils";

test("healthcheck", async () => {
  const kysely = getKyselyInstance();

  const result = await kysely.healthcheck();
  expect(result).toEqual({ status: "healthy" });
});

test("query", async () => {
  const kysely = getKyselyInstance();
  const result = await sql`SELECT * FROM users`.execute(kysely);
  expect(result).toEqual({
    rows: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  });
});

test("shutdown", async () => {
  const kysely = getKyselyInstance();

  await kysely.shutdown();
});
