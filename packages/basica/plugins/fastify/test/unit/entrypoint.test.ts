import { FastifyEntrypoint } from "src/entrypoint";
import { expect, test } from "vitest";

import { logger } from "./utils";

const name = "fastify";

test.todo("Config"); // TODO: test config

test("Error handler", async () => {
  const entrypoint = new FastifyEntrypoint(
    { host: "0.0.0.0", port: 8080 },
    logger,
    name
  );

  entrypoint.fastify.get("/", () => {
    throw new Error("Error");
  });

  const result = await entrypoint.fastify.inject("/");
  expect(result.statusCode).toEqual(500);
  expect(result.json()).toEqual({
    statusCode: 500,
    error: "Internal server error",
    message: "Internal server error",
  });
});
