import { FastifyEntrypoint } from "src/entrypoint";
import { expect, test } from "vitest";

import { logger } from "./utils";

const name = "fastify";

test.todo("Config"); // TODO: test config

test("Error handler", async () => {
  const entrypoint = new FastifyEntrypoint(
    { host: "0.0.0.0", port: 8080 },
    logger,
    name,
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

test.each([
  ["sync", false, "not an Error"],
  ["async", true, "not an Error"],
  ["sync", false, null],
  ["async", true, null],
])(
  "Error handler - non-Error thrown values never leak past the root handler (%s, %s)",
  async (_name, isAsync, thrown) => {
    const entrypoint = new FastifyEntrypoint(
      { host: "0.0.0.0", port: 8080 },
      logger,
      name,
    );

    entrypoint.fastify.get("/", () => {
      if (isAsync) return Promise.reject(thrown);
      throw thrown;
    });

    const result = await entrypoint.fastify.inject("/");

    expect(result.statusCode).toEqual(500);
    expect(result.json()).toEqual({
      statusCode: 500,
      error: "Internal server error",
      message: "Internal server error",
    });
  },
);

test("Error handler - errors with a valid statusCode are left to the root handler", async () => {
  const entrypoint = new FastifyEntrypoint(
    { host: "0.0.0.0", port: 8080 },
    logger,
    name,
  );

  entrypoint.fastify.get("/", () => {
    throw Object.assign(new Error("not found"), { statusCode: 404 });
  });

  const result = await entrypoint.fastify.inject("/");
  expect(result.statusCode).toEqual(404);
});

test.each([99999, 600, -1, NaN, "404"])(
  "Error handler - errors with an out-of-range statusCode (%s) don't crash the process",
  async (statusCode) => {
    const entrypoint = new FastifyEntrypoint(
      { host: "0.0.0.0", port: 8080 },
      logger,
      name,
    );

    entrypoint.fastify.get("/", () => {
      throw Object.assign(new Error("weird"), { statusCode });
    });

    const result = await entrypoint.fastify.inject("/");
    expect(result.statusCode).toEqual(500);
    expect(result.json()).toEqual({
      statusCode: 500,
      error: "Internal server error",
      message: "Internal server error",
    });
  },
);

test("Error handler - validation errors keep their statusCode", async () => {
  const entrypoint = new FastifyEntrypoint(
    { host: "0.0.0.0", port: 8080 },
    logger,
    name,
  );

  entrypoint.fastify.get(
    "/",
    {
      schema: {
        querystring: {
          type: "object",
          properties: { n: { type: "integer" } },
          required: ["n"],
        },
      },
    },
    () => "ok",
  );

  const result = await entrypoint.fastify.inject("/");
  expect(result.statusCode).toEqual(400);
});
