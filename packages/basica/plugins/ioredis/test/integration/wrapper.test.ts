import { beforeEach, describe, expect, inject, test } from "vitest";

import {
  flushCluster,
  flushRedis,
  getClusterWrapper,
  getRedisWrapper,
} from "./utils";

const redisUrl = inject("redisUrl");
const cluster = inject("redisCluster");

beforeEach(async () => {
  await Promise.all([flushRedis(redisUrl), flushCluster(cluster)]);
});

describe("Redis wrapper", () => {
  test("healthcheck", async () => {
    const wrapper = getRedisWrapper(redisUrl);
    const result = await wrapper.healthcheck();
    expect(result).toEqual({ status: "healthy" });
  });

  test("start", async () => {
    const wrapper = getRedisWrapper(redisUrl);
    await wrapper.start();
  });

  test("get/set/get", async () => {
    const { ioredis } = getRedisWrapper(redisUrl);

    await expect(ioredis.get("key")).resolves.toEqual(null);
    await ioredis.set("key", "value");
    await expect(ioredis.get("key")).resolves.toEqual("value");
  });

  test("shutdown", async () => {
    const wrapper = getRedisWrapper(redisUrl);
    await wrapper.shutdown();
  });
});

describe("Cluster wrapper", () => {
  test("healthcheck", async () => {
    const wrapper = getClusterWrapper(cluster);
    const result = await wrapper.healthcheck();
    expect(result).toEqual({ status: "healthy" });
  });

  test("start", async () => {
    const wrapper = getClusterWrapper(cluster);
    await wrapper.start();
  });

  test("get/set/get", async () => {
    const { ioredis } = getClusterWrapper(cluster);

    await expect(ioredis.get("key")).resolves.toEqual(null);
    await ioredis.set("key", "value");
    await expect(ioredis.get("key")).resolves.toEqual("value");
  });

  test("shutdown", async () => {
    const wrapper = getClusterWrapper(cluster);
    await wrapper.shutdown();
  });
}, 100000);
