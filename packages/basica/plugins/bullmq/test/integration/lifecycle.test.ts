import { AppBuilder } from "@basica/core";
import { loggerFactory } from "@basica/core/logger";
import { expect, inject, test } from "vitest";

import { lifecyclePlugin as bullmqLifecyclePlugin } from "src/lifecycle/plugin";

const redisUrl = inject("redisUrl");

test("app.lifecycle.start()/stop() with a bullmq worker", async () => {
  const app = AppBuilder.registerDependencies((di) =>
    di.addSingleton("logger", () => loggerFactory({ level: "silent" })),
  )
    .configureLifecycle((builder) =>
      builder.with(bullmqLifecyclePlugin, (b) =>
        b.addBullMqWorker(
          "worker",
          {
            connection: {
              url: redisUrl,
              timeout: 5000,
              maxRetriesPerRequest: null,
            },
          },
          async () => {},
        ),
      ),
    )
    .build();

  const wrapper = app.services["redis:bullmq:worker"];
  expect(wrapper.ioredis.status).toBe("wait");

  const started = await app.lifecycle.start();
  expect(wrapper.ioredis.status).toBe("ready");

  const stopped = await app.lifecycle.stop();

  expect(started).toBe(true);
  expect(stopped).toBe(true);
}, 30000);
