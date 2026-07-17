import { LifecycleManagerBuilder } from "@basica/core";
import { lifecyclePlugin } from "src/lifecycle/plugin";
import { beforeEach, expect, expectTypeOf, test, vi } from "vitest";

import { AMQPClient } from "src/client";
import { AMQPQueueConsumerEntrypoint } from "src/lifecycle/entrypoint";
import { deps, hcManager, logger } from "../utils";

const client = new AMQPClient(
  {
    urls: "amqp://localhost:5672",
    heartbeatIntervalInSeconds: 1,
  },
  logger,
);

beforeEach(() => {
  vi.restoreAllMocks();
});

test("addAMQPConsumer(config) registers & announces the client service + consumer entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addService");
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addAMQPConsumer(
      "test",
      { urls: "amqp://localhost:5672", heartbeatIntervalInSeconds: 1 },
      { queueName: "test", handler: async () => {} },
    ),
  );

  expect(builder.addService).toHaveBeenCalledOnce();
  const [serviceName, serviceFactory] = vi.mocked(builder.addService).mock
    .calls[0];
  expect(serviceName).toBe("amqp:client:test");
  expect(serviceFactory(deps)).toBeInstanceOf(AMQPClient);

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [entrypointName, entrypointFactory] = vi.mocked(builder.addEntrypoint)
    .mock.calls[0];
  expect(entrypointName).toBe("test");
  expect(entrypointFactory(deps, hcManager)).toBeInstanceOf(
    AMQPQueueConsumerEntrypoint,
  );

  expectTypeOf(app.services["amqp:client:test"]).toEqualTypeOf<AMQPClient>();
  expectTypeOf(
    app.entrypoints.test,
  ).toEqualTypeOf<AMQPQueueConsumerEntrypoint>();
});

test("addAMQPConsumer(client) registers & announces only the consumer entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addService");
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addAMQPConsumer("test", client, {
      queueName: "test",
      handler: async () => {},
    }),
  );

  expect(builder.addService).not.toHaveBeenCalled();
  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [entrypointName, entrypointFactory] = vi.mocked(builder.addEntrypoint)
    .mock.calls[0];
  expect(entrypointName).toBe("test");
  expect(entrypointFactory(deps, hcManager)).toBeInstanceOf(
    AMQPQueueConsumerEntrypoint,
  );

  expectTypeOf(
    app.entrypoints.test,
  ).toEqualTypeOf<AMQPQueueConsumerEntrypoint>();
  expectTypeOf(app.services["amqp:client:test"]).toBeUnknown();
});
