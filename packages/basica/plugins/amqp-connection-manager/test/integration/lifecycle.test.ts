import { AppBuilder } from "@basica/core";
import { loggerFactory } from "@basica/core/logger";
import { expect, inject, test } from "vitest";

import { lifecyclePlugin as amqpLifecyclePlugin } from "src/lifecycle/plugin";

const amqpUrl = inject("amqpUrl");

test("app.lifecycle.start()/stop() with an amqp consumer", async () => {
  const app = AppBuilder.registerDependencies((di) =>
    di.addSingleton("logger", () => loggerFactory({ level: "error" })),
  )
    .configureLifecycle((builder) =>
      builder.with(amqpLifecyclePlugin, (b) =>
        b.addAMQPConsumer(
          "consumer",
          { urls: amqpUrl, heartbeatIntervalInSeconds: 5 },
          { queueName: "lifecycle-test", handler: async () => {} },
        ),
      ),
    )
    .build();

  const started = await app.lifecycle.start();
  const stopped = await app.lifecycle.stop();

  expect(started).toBe(true);
  expect(stopped).toBe(true);
}, 30000);
