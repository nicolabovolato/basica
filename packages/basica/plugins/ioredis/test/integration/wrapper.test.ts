import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from "vitest";

import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import { GenericContainer, StartedTestContainer } from "testcontainers";

import { getClusterWrapper, getRedisWrapper } from "./utils";

let redis: StartedRedisContainer;
let cluster: StartedTestContainer | undefined;

beforeAll(async () => {
  [redis, cluster] = await Promise.all([
    new RedisContainer("redis:7-alpine").start(),
    new GenericContainer("grokzen/redis-cluster:6.2.10")
      .withEnvironment({
        IP: "0.0.0.0",
        INITIAL_PORT: "30000",
      })
      .withExposedPorts(
        {
          container: 30000,
          host: 30000,
        },
        {
          container: 30001,
          host: 30001,
        },
        {
          container: 30002,
          host: 30002,
        },
        {
          container: 30003,
          host: 30003,
        },
        {
          container: 30004,
          host: 30004,
        },
        {
          container: 30005,
          host: 30005,
        }
      )
      .start(),
  ]);
}, 60000);

beforeEach(async () => {
  await redis.executeCliCmd("flushall");
  await cluster?.exec(["redis-cli", "-p", "7000", "flushall"]);
});

afterAll(async () => {
  await redis.stop();
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
