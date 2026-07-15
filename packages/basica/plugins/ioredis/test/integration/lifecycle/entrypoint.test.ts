import { setTimeout } from "node:timers/promises";

import { Redis } from "ioredis";
import { beforeEach, expect, inject, test, vi } from "vitest";

import { loggerFactory } from "@basica/core/logger";

import { RedisSubscriberEntrypoint } from "src/lifecycle/entrypoint";

import { flushRedis, getRedisWrapper } from "../utils";

const redisUrl = inject("redisUrl");
const logger = loggerFactory({ level: "silent" });

beforeEach(async () => {
  await flushRedis(redisUrl);
});

test("channel", async () => {
  const fn1 = vi.fn();
  const fn2 = vi.fn();
  const fn3 = vi.fn().mockRejectedValue(new Error("test error"));
  const fn4 = vi.fn();

  const wrapper = getRedisWrapper(redisUrl);
  const publisher = new Redis(redisUrl);
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
    [],
  );

  await entrypoint.start(new AbortController().signal);

  await publisher.publish("fn1", "test1");
  await vi.waitFor(() =>
    expect(fn1).toHaveBeenCalledExactlyOnceWith(
      "test1",
      expect.any(String),
      "fn1",
      wrapper.ioredis,
    ),
  );

  await publisher.publish("fn2", "test2");
  await vi.waitFor(() =>
    expect(fn2).toHaveBeenCalledExactlyOnceWith(
      "test2",
      expect.any(String),
      "fn2",
      wrapper.ioredis,
    ),
  );

  await publisher.publish("fn3", "test3");
  await vi.waitFor(() =>
    expect(fn3).toHaveBeenCalledExactlyOnceWith(
      "test3",
      expect.any(String),
      "fn3",
      wrapper.ioredis,
    ),
  );

  await entrypoint.shutdown(new AbortController().signal);

  // fn4 is unsubscribed after shutdown, so it never fires
  await publisher.publish("fn4", "test4");
  await setTimeout(200);
  expect(fn4).not.toHaveBeenCalled();

  publisher.disconnect();
});

test("pattern", async () => {
  const fnChannel = vi.fn();
  const fn = vi.fn();

  const wrapper = getRedisWrapper(redisUrl);
  const publisher = new Redis(redisUrl);
  const entrypoint = new RedisSubscriberEntrypoint(
    wrapper,
    logger,
    "test",
    [{ channel: "channel:first:0", fn: fnChannel }],
    [],
    [{ channel: "channel:*:?", fn }],
  );

  await entrypoint.start(new AbortController().signal);

  await publisher.publish("channel:first:0", "test1");
  await publisher.publish("channel:first:1", "test2");
  await publisher.publish("channel:second:0", "test3");

  await vi.waitFor(() => expect(fn).toHaveBeenCalledTimes(3));

  await entrypoint.shutdown(new AbortController().signal);

  // published after shutdown, so it must not reach either handler
  await publisher.publish("channel:first:0", "test4");
  await setTimeout(200);

  // the pattern subscription matches all three channels, in publish order
  expect(fn).toHaveBeenNthCalledWith(
    1,
    "test1",
    expect.any(String),
    "channel:first:0",
    wrapper.ioredis,
  );
  expect(fn).toHaveBeenNthCalledWith(
    2,
    "test2",
    expect.any(String),
    "channel:first:1",
    wrapper.ioredis,
  );
  expect(fn).toHaveBeenNthCalledWith(
    3,
    "test3",
    expect.any(String),
    "channel:second:0",
    wrapper.ioredis,
  );

  // the exact-channel subscription only matches the first
  expect(fnChannel).toHaveBeenCalledExactlyOnceWith(
    "test1",
    expect.any(String),
    "channel:first:0",
    wrapper.ioredis,
  );

  publisher.disconnect();
});
