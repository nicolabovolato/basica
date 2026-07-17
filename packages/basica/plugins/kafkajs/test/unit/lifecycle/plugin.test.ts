import { LifecycleManagerBuilder } from "@basica/core";
import { beforeEach, expect, expectTypeOf, test, vi } from "vitest";

import { Kafka } from "src/client";
import { KafkaConsumerEntrypoint } from "src/lifecycle/entrypoint";
import { lifecyclePlugin } from "src/lifecycle/plugin";
import { deps, hcManager, logger } from "../utils";

const client = new Kafka(
  {
    brokers: ["localhost:9092"],
    timeout: 5000,
  },
  logger,
);

beforeEach(() => {
  vi.restoreAllMocks();
});

const entrypointConfig = {
  create: { groupId: "test" },
  subscribe: { topics: ["test"] },
  run: { eachMessage: async () => {} },
};

test("addKafkaConsumer(client) registers & announces the consumer entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addKafkaConsumer("test", client, entrypointConfig),
  );

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addEntrypoint).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps, hcManager)).toBeInstanceOf(KafkaConsumerEntrypoint);

  expectTypeOf(app.entrypoints.test).toEqualTypeOf<KafkaConsumerEntrypoint>();
});

test("addKafkaConsumer(config) registers & announces the consumer entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addKafkaConsumer(
      "test",
      { brokers: ["localhost:9092"], timeout: 5000 },
      entrypointConfig,
    ),
  );

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addEntrypoint).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps, hcManager)).toBeInstanceOf(KafkaConsumerEntrypoint);

  expectTypeOf(app.entrypoints.test).toEqualTypeOf<KafkaConsumerEntrypoint>();
});
