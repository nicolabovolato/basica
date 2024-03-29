import { loggerFactory } from "@basica/core/logger";
import { RedisSubscriberEntrypointBuilder } from "src/lifecycle/builder";
import { RedisSubscriberEntrypoint } from "src/lifecycle/entrypoint";

import { RedisWrapper } from "src/redis";
import { beforeEach, expect, test, vi } from "vitest";

const logger = loggerFactory({ level: "silent" });
const wrapper = new RedisWrapper(
  {
    url: "redis://localhost:6379",
    timeout: 1000,
  },
  logger
);

vi.mock("src/lifecycle/entrypoint", () => {
  return { RedisSubscriberEntrypoint: vi.fn() };
});

beforeEach(async () => {
  vi.restoreAllMocks();
});

test("builder", async () => {
  const fn = async () => {};

  const result = new RedisSubscriberEntrypointBuilder(wrapper, logger, "test")
    .subscribeTo("test1", fn)
    .subscribeTo("test2", fn)
    .subscribeToShard("test3", fn)
    .subscribeToShard("test4", fn)
    .subscribeToPattern("test5", fn)
    .subscribeToPattern("test6", fn)
    .build();

  expect(result).toBeInstanceOf(RedisSubscriberEntrypoint);
  expect(RedisSubscriberEntrypoint).toHaveBeenCalledOnce();
  expect(RedisSubscriberEntrypoint).toHaveBeenCalledWith(
    wrapper,
    logger,
    "test",
    [
      { channel: "test1", fn },
      { channel: "test2", fn },
    ],
    [
      { channel: "test3", fn },
      { channel: "test4", fn },
    ],
    [
      { channel: "test5", fn },
      { channel: "test6", fn },
    ]
  );
});
