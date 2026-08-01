import { AppBuilder } from "@basica/core";
import { loggerFactory } from "@basica/core/logger";
import { expect, inject, test } from "vitest";

import { Client } from "src/client";

const pgUrl = inject("pgUrl");

test("app.lifecycle.start()/stop() with a pg client service", async () => {
  const client = new Client(
    { connectionString: pgUrl, connectionTimeoutMillis: 1000 },
    loggerFactory({ level: "error" }),
    "test",
  );

  const app = AppBuilder.registerDependencies((di) =>
    di
      .addSingleton("logger", () => loggerFactory({ level: "error" }))
      .addSingleton("db", () => client),
  )
    .configureLifecycle((builder, deps) =>
      builder.addService("db", () => deps.db),
    )
    .build();

  const started = await app.lifecycle.start();
  const stopped = await app.lifecycle.stop();

  expect(started).toBe(true);
  expect(stopped).toBe(true);
});
