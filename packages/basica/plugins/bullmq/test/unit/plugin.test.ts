import { LifecycleManagerBuilder } from "@basica/core";
import { lifecyclePlugin } from "src/lifecycle/plugin";
import { beforeEach, expect, expectTypeOf, test, vi } from "vitest";

import { ClusterWrapper, RedisWrapper } from "@basica/ioredis";
import { BullMqWorkerEntrypoint } from "src/lifecycle/entrypoint";
import { deps, hcManager } from "./utils";

const redisConfig = {
  url: "redis://localhost:6379",
  timeout: 1000,
  maxRetriesPerRequest: null,
};
const clusterConfig = {
  nodes: [{ host: "localhost", port: 6379 }],
  timeout: 1000,
  maxRetriesPerRequest: null,
};
const redis = new RedisWrapper(redisConfig, deps.logger).ioredis;

type Entry = BullMqWorkerEntrypoint<unknown, void>;
type WrapperService = RedisWrapper | ClusterWrapper;

beforeEach(() => {
  vi.restoreAllMocks();
});

test("addBullMqWorker(config) registers & announces the wrapper service + worker entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addService");
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addBullMqWorker("test", { connection: redisConfig }, async () => {}),
  );

  expect(builder.addService).toHaveBeenCalledOnce();
  const [serviceName, serviceFactory] = vi.mocked(builder.addService).mock
    .calls[0];
  expect(serviceName).toBe("redis:bullmq:test");
  expect(serviceFactory(deps)).toBeInstanceOf(RedisWrapper);

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [entrypointName, entrypointFactory] = vi.mocked(builder.addEntrypoint)
    .mock.calls[0];
  expect(entrypointName).toBe("test");
  expect(entrypointFactory(deps, hcManager)).toBeInstanceOf(
    BullMqWorkerEntrypoint,
  );

  expectTypeOf(
    app.services["redis:bullmq:test"],
  ).toEqualTypeOf<WrapperService>();
  expectTypeOf(app.entrypoints.test).toEqualTypeOf<Entry>();
});

test("addBullMqWorker(queueName, config) registers & announces the wrapper service + worker entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addService");
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addBullMqWorker(
      "test",
      "queue",
      { connection: redisConfig },
      async () => {},
    ),
  );

  expect(builder.addService).toHaveBeenCalledOnce();
  const [serviceName, serviceFactory] = vi.mocked(builder.addService).mock
    .calls[0];
  expect(serviceName).toBe("redis:bullmq:test");
  expect(serviceFactory(deps)).toBeInstanceOf(RedisWrapper);

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [entrypointName, entrypointFactory] = vi.mocked(builder.addEntrypoint)
    .mock.calls[0];
  expect(entrypointName).toBe("test");
  expect(entrypointFactory(deps, hcManager)).toBeInstanceOf(
    BullMqWorkerEntrypoint,
  );

  expectTypeOf(
    app.services["redis:bullmq:test"],
  ).toEqualTypeOf<WrapperService>();
  expectTypeOf(app.entrypoints.test).toEqualTypeOf<Entry>();
});

test("addBullMqWorker(instance) registers & announces only the worker entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addService");
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addBullMqWorker("test", { connection: redis }, async () => {}),
  );

  expect(builder.addService).not.toHaveBeenCalled();
  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addEntrypoint).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps, hcManager)).toBeInstanceOf(BullMqWorkerEntrypoint);

  expectTypeOf(app.entrypoints.test).toEqualTypeOf<Entry>();
  expectTypeOf(app.services["redis:bullmq:test"]).toBeUnknown();
});

test("addBullMqWorker(queueName, instance) registers & announces only the worker entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addService");
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addBullMqWorker("test", "queue", { connection: redis }, async () => {}),
  );

  expect(builder.addService).not.toHaveBeenCalled();
  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addEntrypoint).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps, hcManager)).toBeInstanceOf(BullMqWorkerEntrypoint);

  expectTypeOf(app.entrypoints.test).toEqualTypeOf<Entry>();
  expectTypeOf(app.services["redis:bullmq:test"]).toBeUnknown();
});

test("addBullMqWorker with a cluster config registers a ClusterWrapper service", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addService");

  builder.with(lifecyclePlugin, (b) =>
    b.addBullMqWorker("test", { connection: clusterConfig }, async () => {}),
  );

  expect(builder.addService).toHaveBeenCalledOnce();
  expect(vi.mocked(builder.addService).mock.calls[0][1](deps)).toBeInstanceOf(
    ClusterWrapper,
  );
});
