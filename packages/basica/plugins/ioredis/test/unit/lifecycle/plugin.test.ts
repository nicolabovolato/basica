import { LifecycleManagerBuilder } from "@basica/core";
import { lifecyclePlugin } from "src/lifecycle/plugin";
import { beforeEach, expect, test, vi } from "vitest";

import { RedisSubscriberEntrypoint } from "src/lifecycle/entrypoint";
import { RedisWrapper } from "src/redis";
import { deps, hcManager, logger } from "../utils";

const wrapper = new RedisWrapper(
  {
    url: "redis://localhost:6379",
    timeout: 1000,
  },
  logger
);

beforeEach(() => {
  vi.restoreAllMocks();
});

test("addRedisSubscriber", async () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addEntrypoint");

  builder.with(lifecyclePlugin, (builder) =>
    builder
      .addRedisSubscriber("test", wrapper, (builder) => builder)
      .addRedisSubscriber(
        "test",
        {
          url: "redis://localhost:6379",
          timeout: 1000,
        },
        (builder) => builder
      )
  );

  expect(builder.addEntrypoint).toHaveBeenCalledTimes(2);
  for (const [name, fn] of vi.mocked(builder.addEntrypoint).mock.calls) {
    expect(name).toBe("test");
    expect(fn(deps, hcManager)).toBeInstanceOf(RedisSubscriberEntrypoint);
  }
});

test.todo("plugin (type tests?)"); // TODO: test plugin
