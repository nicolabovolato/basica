import { AppBuilder } from "@basica/core";
import { loggerFactory } from "@basica/core/logger";
import { expect, inject, test } from "vitest";

import { lifecyclePlugin as redisLifecyclePlugin } from "src/lifecycle/plugin";

const redisUrl = inject("redisUrl");

test("app.lifecycle.start()/stop() with a redis subscriber", async () => {
  const app = AppBuilder.registerDependencies((di) =>
    di.addSingleton("logger", () => loggerFactory({ level: "error" })),
  )
    .configureLifecycle((builder) =>
      builder.with(redisLifecyclePlugin, (b) =>
        b.addRedisSubscriber(
          "subscriber",
          { url: redisUrl, timeout: 1000 },
          (sb) => sb.subscribeTo("channel", async () => {}),
        ),
      ),
    )
    .build();

  const started = await app.lifecycle.start();
  const stopped = await app.lifecycle.stop();

  expect(started).toBe(true);
  expect(stopped).toBe(true);
}, 15000);
