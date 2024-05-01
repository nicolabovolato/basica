import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { afterAll, beforeAll, expect, test } from "vitest";
import { getTestApp } from "../utils";

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer("postgres:16-alpine").start();
}, 60000);

afterAll(async () => {
  await container.stop();
});

test("start/stop", async () => {
  const app = getTestApp(container);

  const startResult = await app.lifecycle.start();
  const stopResult = await app.lifecycle.stop();

  expect(startResult).toBe(true);
  expect(stopResult).toBe(true);
}, 15000);
