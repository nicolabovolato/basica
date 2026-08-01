import { AppBuilder } from "@basica/core";
import { loggerFactory } from "@basica/core/logger";
import { expect, inject, test } from "vitest";

import { lifecyclePlugin as kafkaLifecyclePlugin } from "src/lifecycle/plugin";

import { getKafkaClient } from "./utils";

const broker = inject("kafkaBroker");

test("app.lifecycle.start()/stop() with a kafka consumer", async () => {
  const topic = "lifecycle-test";

  const admin = getKafkaClient(broker).admin();
  await admin.start();
  await admin.createTopics({ topics: [{ topic }], waitForLeaders: true });
  await admin.shutdown();

  const app = AppBuilder.registerDependencies((di) =>
    di.addSingleton("logger", () => loggerFactory({ level: "error" })),
  )
    .configureLifecycle(
      { startupTimeoutMs: 20000, shutdownTimeoutMs: 20000 },
      (builder) =>
        builder.with(kafkaLifecyclePlugin, (b) =>
          b.addKafkaConsumer(
            "consumer",
            { brokers: [broker], timeout: 5000 },
            {
              create: { groupId: "lifecycle-test" },
              subscribe: { topic },
              run: { eachMessage: async () => {} },
            },
          ),
        ),
    )
    .build();

  const started = await app.lifecycle.start();
  const stopped = await app.lifecycle.stop();

  expect(started).toBe(true);
  expect(stopped).toBe(true);
}, 30000);
