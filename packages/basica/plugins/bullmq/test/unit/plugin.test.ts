import { LifecycleManagerBuilder } from "@basica/core";
import { lifecyclePlugin } from "src/plugin";
import { beforeEach, expect, test, vi } from "vitest";

import { hcManager, services } from "./utils";
import { BullMqWorkerEntrypoint } from "src/entrypoint";
import { ClusterWrapper, RedisWrapper } from "@basica/ioredis";
import { Job } from "bullmq";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("addFastifyEntrypoint", async () => {
  const builder = new LifecycleManagerBuilder(services, hcManager);
  vi.spyOn(builder, "addEntrypoint");
  vi.spyOn(builder, "addService");

  const ioredis = new RedisWrapper(
    {
      url: "redis://localhost:6379",
      timeout: 1000,
      maxRetriesPerRequest: null,
    },
    services.logger,
    "ioredis"
  );

  builder.with(lifecyclePlugin, (builder) =>
    builder
      .addBullMqWorker(
        "test",
        { connection: ioredis.ioredis },
        async (x: Job) => {}
      )
      .addBullMqWorker(
        "test",
        "queue",
        { connection: ioredis.ioredis },
        async (x: Job) => {}
      )
      .addBullMqWorker(
        "test",
        {
          connection: {
            url: "redis://localhost:6379",
            timeout: 1000,
            maxRetriesPerRequest: null,
          },
        },
        async (x: Job) => {}
      )
      .addBullMqWorker(
        "test",
        "queue",
        {
          connection: {
            url: "redis://localhost:6379",
            timeout: 1000,
            maxRetriesPerRequest: null,
          },
        },
        async (x: Job) => {}
      )
      .addBullMqWorker(
        "test",
        {
          connection: {
            nodes: [{ host: "localhost", port: 6379 }],
            timeout: 1000,
            maxRetriesPerRequest: null,
          },
        },
        async (x: Job) => {}
      )
      .addBullMqWorker(
        "test",
        "queue",
        {
          connection: {
            nodes: [{ host: "localhost", port: 6379 }],
            timeout: 1000,
            maxRetriesPerRequest: null,
          },
        },
        async (x: Job) => {}
      )
  );

  expect(builder.addService).toHaveBeenCalledTimes(4);
  for (const [name, fn] of vi.mocked(builder.addService).mock.calls) {
    expect(name).toBe("redis:bullmq:test");
    let cls: unknown = RedisWrapper;
    const service = fn(services);
    if (!(service instanceof RedisWrapper)) {
      cls = ClusterWrapper;
    }
    expect(service).toBeInstanceOf(cls);
  }

  expect(builder.addEntrypoint).toHaveBeenCalledTimes(6);
  for (const [name, fn] of vi.mocked(builder.addEntrypoint).mock.calls) {
    expect(name).toBe("test");
    expect(fn(services, hcManager)).toBeInstanceOf(BullMqWorkerEntrypoint);
  }
});

test.todo("plugin (type tests?)"); // TODO: test plugin
