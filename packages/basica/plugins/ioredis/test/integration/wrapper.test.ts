import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";

import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";

import {
  getClusterWrapper,
  getRedisWrapper,
  startRedisCluster,
  RedisClusterHandle,
} from "./utils";

let redis: StartedRedisContainer;
let cluster: RedisClusterHandle | undefined;

beforeAll(async () => {
  [redis, cluster] = await Promise.all([
    new RedisContainer("redis:8-alpine").start(),
    startRedisCluster(),
  ]);
}, 60000);

beforeEach(async () => {
  await redis.executeCliCmd("flushall");
  await cluster?.flushall();
});

afterAll(async () => {
  await redis?.stop();
  await cluster?.stop();
});

describe("Redis wrapper", () => {
  test("healthcheck", async () => {
    const wrapper = getRedisWrapper(redis);
    const result = await wrapper.healthcheck();
    expect(result).toEqual({ status: "healthy" });
  });

  test("start", async () => {
    const wrapper = getRedisWrapper(redis);
    await wrapper.start();
  });

  test("get/set/get", async () => {
    const { ioredis } = getRedisWrapper(redis);

    await expect(ioredis.get("key")).resolves.toEqual(null);
    await ioredis.set("key", "value");
    await expect(ioredis.get("key")).resolves.toEqual("value");
  });

  test("shutdown", async () => {
    const wrapper = getRedisWrapper(redis);
    await wrapper.shutdown();
  });
});

describe("Cluster wrapper", () => {
  test("healthcheck", async () => {
    const wrapper = getClusterWrapper(cluster!);
    const result = await wrapper.healthcheck();
    expect(result).toEqual({ status: "healthy" });
  });

  test("start", async () => {
    const wrapper = getClusterWrapper(cluster!);
    await wrapper.start();
  });

  test("get/set/get", async () => {
    const { ioredis } = getClusterWrapper(cluster!);

    await expect(ioredis.get("key")).resolves.toEqual(null);
    await ioredis.set("key", "value");
    await expect(ioredis.get("key")).resolves.toEqual("value");
  });

  test("shutdown", async () => {
    const wrapper = getClusterWrapper(cluster!);
    await wrapper.shutdown();
  });
}, 100000);
