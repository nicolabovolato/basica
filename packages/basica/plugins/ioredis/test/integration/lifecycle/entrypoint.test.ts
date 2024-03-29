import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import { getRedisWrapper } from "../utils";
import { RedisSubscriberEntrypoint } from "src/lifecycle/entrypoint";
import { loggerFactory } from "@basica/core/logger";

let redis: StartedRedisContainer;
const logger = loggerFactory({ level: "silent" });

beforeAll(async () => {
  redis = await new RedisContainer("redis:7-alpine").start();
}, 60000);

beforeEach(async () => {
  await redis.executeCliCmd("flushall");
});

afterAll(async () => {
  await redis.stop();
});

test("channel", async () => {
  const fn1 = vi.fn();
  const fn2 = vi.fn();
  const fn3 = vi.fn().mockRejectedValue(new Error("test error"));
  const fn4 = vi.fn();

  const wrapper = getRedisWrapper(redis);
  const entrypoint = new RedisSubscriberEntrypoint(
    wrapper,
    logger,
    "test",
    [
      { channel: "fn1", fn: fn1 },
      { channel: "fn2", fn: fn2 },
      { channel: "fn3", fn: fn3 },
      { channel: "fn4", fn: fn4 },
    ],
    [],
    []
  );

  await entrypoint.start(new AbortController().signal);

  await redis.executeCliCmd("publish", ["fn1", "test1"]);
  expect(fn1).toHaveBeenCalledOnce();
  expect(fn1).toHaveBeenCalledWith(
    "test1",
    expect.any(String),
    "fn1",
    wrapper.ioredis
  );

  await redis.executeCliCmd("publish", ["fn2", "test2"]);
  expect(fn2).toHaveBeenCalledOnce();
  expect(fn2).toHaveBeenCalledWith(
    "test2",
    expect.any(String),
    "fn2",
    wrapper.ioredis
  );

  await redis.executeCliCmd("publish", ["fn3", "test3"]);
  expect(fn3).toHaveBeenCalledOnce();
  expect(fn3).toHaveBeenCalledWith(
    "test3",
    expect.any(String),
    "fn3",
    wrapper.ioredis
  );

  await entrypoint.shutdown(new AbortController().signal);

  await redis.executeCliCmd("publish", ["fn4", "test4"]);
  expect(fn4).not.toHaveBeenCalled();
});

test("pattern", async () => {
  const fnChannel = vi.fn();
  const fn = vi.fn();

  const wrapper = getRedisWrapper(redis);
  const entrypoint = new RedisSubscriberEntrypoint(
    wrapper,
    logger,
    "test",
    [{ channel: "channel:first:0", fn: fnChannel }],
    [],
    [{ channel: "channel:*:?", fn }]
  );

  await entrypoint.start(new AbortController().signal);

  await redis.executeCliCmd("publish", ["channel:first:0", "test1"]);
  await redis.executeCliCmd("publish", ["channel:first:1", "test2"]);
  await redis.executeCliCmd("publish", ["channel:second:0", "test3"]);

  await entrypoint.shutdown(new AbortController().signal);

  await redis.executeCliCmd("publish", ["channel:first:0", "test4"]);

  expect(fn).toHaveBeenCalledTimes(3);
  expect(fn).toHaveBeenNthCalledWith(
    1,
    "test1",
    expect.any(String),
    "channel:first:0",
    wrapper.ioredis
  );
  expect(fn).toHaveBeenNthCalledWith(
    2,
    "test2",
    expect.any(String),
    "channel:first:1",
    wrapper.ioredis
  );
  expect(fn).toHaveBeenNthCalledWith(
    3,
    "test3",
    expect.any(String),
    "channel:second:0",
    wrapper.ioredis
  );

  expect(fnChannel).toHaveBeenCalledOnce();
  expect(fnChannel).toHaveBeenCalledWith(
    "test1",
    expect.any(String),
    "channel:first:0",
    wrapper.ioredis
  );
});
