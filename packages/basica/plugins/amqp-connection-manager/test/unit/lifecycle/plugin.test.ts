import { LifecycleManagerBuilder } from "@basica/core";
import { lifecyclePlugin } from "src/lifecycle/plugin";
import { beforeEach, expect, test, vi } from "vitest";

import { AMQPClient } from "src/client";
import { AMQPQueueConsumerEntrypoint } from "src/lifecycle/entrypoint";
import { hcManager, logger, services } from "../utils";

const client = new AMQPClient(
  {
    urls: "amqp://localhost:5672",
    heartbeatIntervalInSeconds: 1,
  },
  logger
);

beforeEach(() => {
  vi.restoreAllMocks();
});

test("addAMQPConsumer", async () => {
  const builder = new LifecycleManagerBuilder(services);
  vi.spyOn(builder, "addEntrypoint");
  vi.spyOn(builder, "addService");

  builder.with(lifecyclePlugin, (builder) =>
    builder
      .addAMQPConsumer("test", client, {
        queueName: "test",
        handler: async () => {},
      })
      .addAMQPConsumer(
        "test",
        {
          urls: "amqp://localhost:5672",
          heartbeatIntervalInSeconds: 1,
        },
        {
          queueName: "test",
          handler: async () => {},
        }
      )
  );

  expect(builder.addService).toHaveBeenCalledTimes(1);
  for (const [name, fn] of vi.mocked(builder.addService).mock.calls) {
    expect(name).toBe("amqp:client:test");
    expect(fn(services)).toBeInstanceOf(AMQPClient);
  }

  expect(builder.addEntrypoint).toHaveBeenCalledTimes(2);
  for (const [name, fn] of vi.mocked(builder.addEntrypoint).mock.calls) {
    expect(name).toBe("test");
    expect(fn(services, hcManager)).toBeInstanceOf(AMQPQueueConsumerEntrypoint);
  }
});

test.todo("plugin (type tests?)"); // TODO: test plugin
