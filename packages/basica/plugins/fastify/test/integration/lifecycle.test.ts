import { AppBuilder } from "@basica/core";
import { loggerFactory } from "@basica/core/logger";
import { expect, test } from "vitest";

import { lifecyclePlugin as fastifyLifecyclePlugin } from "src/plugin";

test("app.lifecycle.start()/stop() with a fastify entrypoint", async () => {
  const app = AppBuilder.registerDependencies((di) =>
    di.addSingleton("logger", () => loggerFactory({ level: "error" })),
  )
    .configureLifecycle((builder) =>
      builder.with(fastifyLifecyclePlugin, (b) =>
        b.addFastifyEntrypoint("http", { port: 0 }, (b) =>
          b.configureApp((app) => app.fastify.get("/", async () => "OK")),
        ),
      ),
    )
    .build();

  const started = await app.lifecycle.start();
  const stopped = await app.lifecycle.stop();

  expect(started).toBe(true);
  expect(stopped).toBe(true);
});
