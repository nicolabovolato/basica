import { LifecycleManagerBuilder } from "@basica/core";
import { lifecyclePlugin } from "src/plugin";
import { beforeEach, expect, test, vi } from "vitest";

import { FastifyEntrypoint } from "src/entrypoint";
import { hcManager, services } from "./utils";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("addFastifyEntrypoint", async () => {
  const builder = new LifecycleManagerBuilder(services);
  vi.spyOn(builder, "addEntrypoint");

  builder.with(lifecyclePlugin, (builder) =>
    builder
      .addFastifyEntrypoint("test", (builder) => builder)
      .addFastifyEntrypoint(
        "test",
        { host: "localhost", port: 3000 },
        (builder) => builder
      )
  );

  expect(builder.addEntrypoint).toHaveBeenCalledTimes(2);
  for (const [name, fn] of vi.mocked(builder.addEntrypoint).mock.calls) {
    expect(name).toBe("test");
    expect(fn(services, hcManager)).toBeInstanceOf(FastifyEntrypoint);
  }
});

test.todo("plugin (type tests?)"); // TODO: test plugin
