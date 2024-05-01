import { LifecycleManagerBuilder } from "@basica/core";
import { beforeEach, expect, test, vi } from "vitest";

import { Kafka } from "src/client";
import { KafkaConsumerEntrypoint } from "src/lifecycle/entrypoint";
import { lifecyclePlugin } from "src/lifecycle/plugin";
import { deps, hcManager, logger } from "../utils";

const client = new Kafka(
  {
    brokers: ["localhost:9092"],
    timeout: 5000,
  },
  logger
);

beforeEach(() => {
  vi.restoreAllMocks();
});

test("addAMQPConsumer", async () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addEntrypoint");

  builder.with(lifecyclePlugin, (builder) =>
    builder
      .addKafkaConsumer("test", client, {
        create: {
          groupId: "test",
        },
        subscribe: {
          topics: ["test"],
        },
        run: {
          eachMessage: async () => {},
        },
      })
      .addKafkaConsumer(
        "test",
        {
          brokers: ["localhost:9092"],
          timeout: 5000,
        },
        {
          create: {
            groupId: "test",
          },
          subscribe: {
            topics: ["test"],
          },
          run: { eachMessage: async () => {} },
        }
      )
  );

  expect(builder.addEntrypoint).toHaveBeenCalledTimes(2);
  for (const [name, fn] of vi.mocked(builder.addEntrypoint).mock.calls) {
    expect(name).toBe("test");
    expect(fn(deps, hcManager)).toBeInstanceOf(KafkaConsumerEntrypoint);
  }
});

test.todo("plugin (type tests?)"); // TODO: test plugin
