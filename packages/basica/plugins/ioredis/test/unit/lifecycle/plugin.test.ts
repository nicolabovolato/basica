import { LifecycleManagerBuilder } from "@basica/core";
import { Cluster, Redis } from "ioredis";
import { lifecyclePlugin } from "src/lifecycle/plugin";
import { beforeEach, expect, expectTypeOf, test, vi } from "vitest";

import { ClusterWrapper } from "src/cluster";
import { RedisSubscriberEntrypoint } from "src/lifecycle/entrypoint";
import { RedisWrapper } from "src/redis";
import { deps, hcManager, logger } from "../utils";

const redisWrapper = new RedisWrapper(
  { url: "redis://localhost:6379", timeout: 1000 },
  logger
);
const clusterWrapper = new ClusterWrapper(
  { nodes: [{ host: "localhost", port: 6379 }], timeout: 1000 },
  logger
);

beforeEach(() => {
  vi.restoreAllMocks();
});

test("addRedisSubscriber(redis wrapper, fn) registers & announces a Redis subscriber entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addRedisSubscriber("test", redisWrapper, (b) => b)
  );

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addEntrypoint).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps, hcManager)).toBeInstanceOf(RedisSubscriberEntrypoint);

  expectTypeOf(app.entrypoints.test).toEqualTypeOf<
    RedisSubscriberEntrypoint<Redis>
  >();
});

test("addRedisSubscriber(cluster wrapper, fn) registers & announces a Cluster subscriber entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addRedisSubscriber("test", clusterWrapper, (b) => b)
  );

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addEntrypoint).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps, hcManager)).toBeInstanceOf(RedisSubscriberEntrypoint);

  expectTypeOf(app.entrypoints.test).toEqualTypeOf<
    RedisSubscriberEntrypoint<Cluster>
  >();
});

test("addRedisSubscriber(redis config, fn) registers & announces a Redis subscriber entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addRedisSubscriber(
      "test",
      { url: "redis://localhost:6379", timeout: 1000 },
      (b) => b
    )
  );

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addEntrypoint).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps, hcManager)).toBeInstanceOf(RedisSubscriberEntrypoint);

  expectTypeOf(app.entrypoints.test).toEqualTypeOf<
    RedisSubscriberEntrypoint<Redis>
  >();
});

test("addRedisSubscriber(cluster config, fn) registers & announces a Cluster subscriber entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addRedisSubscriber(
      "test",
      { nodes: [{ host: "localhost", port: 6379 }], timeout: 1000 },
      (b) => b
    )
  );

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addEntrypoint).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps, hcManager)).toBeInstanceOf(RedisSubscriberEntrypoint);

  expectTypeOf(app.entrypoints.test).toEqualTypeOf<
    RedisSubscriberEntrypoint<Cluster>
  >();
});
