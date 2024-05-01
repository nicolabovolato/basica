import { healthcheckResultSchema } from "@basica/core";
import { Static } from "@sinclair/typebox";
import { FastifyEntrypointBuilder } from "src/builder";
import { mapHealthchecksConfigSchema } from "src/config";
import { beforeEach, expect, test, vi } from "vitest";

import { deps, hcManager } from "./utils";

const name = "fastify";

beforeEach(() => {
  vi.restoreAllMocks();
});

test.each([
  [
    undefined,
    { svc1: { status: "healthy" } },
    { status: "healthy", healthchecks: [{ name: "svc1", status: "healthy" }] },
    undefined,
  ],
  [
    { path: "/healthcheck", healthyStatusCode: 299 },
    { svc1: { status: "healthy" } },
    { status: "healthy", healthchecks: [{ name: "svc1", status: "healthy" }] },
    (name) => name == "svc1",
  ],
  [
    { path: "/healthcheck", unhealthyStatusCode: 499 },
    {
      svc1: {
        status: "unhealthy",
        description: "error",
        error: new Error("error"),
      },
      svc2: {
        status: "healthy",
      },
    },
    {
      status: "unhealthy",
      healthchecks: [
        { name: "svc1", status: "unhealthy", description: "error" },
        { name: "svc2", status: "healthy" },
      ],
    },
    () => true,
  ],
] as [
  Partial<Static<typeof mapHealthchecksConfigSchema>> | undefined,
  Record<string, Static<typeof healthcheckResultSchema>>,
  { status: "healthy" | "unhealthy" } & Record<string, unknown>,
  ((name: string) => boolean) | undefined,
][])("healthchecks", async (config, healthcheckResult, expected, filterFn) => {
  hcManager.healthcheck.mockResolvedValue(healthcheckResult);

  const entrypoint = new FastifyEntrypointBuilder(deps, hcManager, name)
    .mapHealthchecks(config, filterFn)
    .build();

  const shouldBeHealthy = expected.status == "healthy";

  const result = await entrypoint.fastify.inject(config?.path ?? "/health");

  expect(result.statusCode).toEqual(
    shouldBeHealthy
      ? config?.healthyStatusCode ?? 200
      : config?.unhealthyStatusCode ?? 500
  );

  expect(result.json()).toEqual(expected);

  expect(hcManager.healthcheck).toHaveBeenCalledOnce();
  expect(hcManager.healthcheck).toHaveBeenCalledWith(filterFn);
});

class CustomError1 extends Error {
  public readonly name = "CustomError1";
}
class CustomError2 extends Error {
  public readonly name = "CustomError2";
  constructor(public readonly type: "A" | "B") {
    super();
  }
}

test.each([
  [
    new Error(),
    500,
    {
      statusCode: 500,
      error: "Internal server error",
      message: "Internal server error",
    },
  ],
  [
    new CustomError1("err message"),
    599,
    {
      statusCode: 599,
      error: "CustomError1",
      message: "err message",
    },
  ],
  [
    new CustomError2("A"),
    598,
    {
      statusCode: 598,
      error: "CustomError2",
      message: "",
    },
  ],
  [
    new CustomError2("B"),
    597,
    {
      statusCode: 597,
      error: "CustomError2",
      message: "",
    },
  ],
])("mapErrors", async (err, status, body) => {
  const entrypoint = new FastifyEntrypointBuilder(deps, hcManager, name)
    .configureApp((app) =>
      app
        .mapErrors((e) =>
          e
            .mapError(CustomError1, 599)
            .mapError(CustomError2, (e) => (e.type == "A" ? 598 : 597))
        )
        .fastify.get("/", () => {
          throw err;
        })
    )
    .build();

  const result = await entrypoint.fastify.inject("/");

  expect(result.statusCode).toEqual(status);

  expect(result.json()).toEqual(body);
});

test("useOpenapi", async () => {
  const entrypoint = new FastifyEntrypointBuilder(deps, hcManager, name)
    .configureApp((app) => app.useOpenapi().fastify.get("/", () => "OK"))
    .build();

  const result = await entrypoint.fastify.inject("/documentation");

  expect(result.statusCode).toBeLessThan(400);
});

test("mapRoutes", async () => {
  const entrypoint = new FastifyEntrypointBuilder(deps, hcManager, name)
    .configureApp((app) =>
      app
        .mapRoutes("/test", (app) =>
          app.fastify
            .get("/", () => "test root")
            .get("/test", () => "test test")
        )
        .mapRoutes("/test2", (app) =>
          app.fastify.get("/test", () => "test2 test")
        )
        .mapRoutes("/", (app) => app.fastify.get("/", () => "root"))
    )
    .build();

  const urlsMap = {
    "/": "root",
    "/test": "test root",
    "/test/test": "test test",
    "/test2/test": "test2 test",
  };
  for (const [url, body] of Object.entries(urlsMap)) {
    const result = await entrypoint.fastify.inject(url);
    expect(result.statusCode).toEqual(200);
    expect(result.body).toEqual(body);
  }
});
