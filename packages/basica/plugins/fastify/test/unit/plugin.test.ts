import { LifecycleManagerBuilder } from "@basica/core";
import { lifecyclePlugin } from "src/plugin";
import { beforeEach, expect, expectTypeOf, test, vi } from "vitest";

import { FastifyEntrypoint } from "src/entrypoint";
import { deps, hcManager } from "./utils";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("addFastifyEntrypoint(fn) registers & announces the entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addFastifyEntrypoint("test", (b) => b),
  );

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addEntrypoint).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps, hcManager)).toBeInstanceOf(FastifyEntrypoint);

  expectTypeOf(app.entrypoints.test).toEqualTypeOf<FastifyEntrypoint>();
});

test("addFastifyEntrypoint(config, fn) registers & announces the entrypoint", () => {
  const builder = new LifecycleManagerBuilder(deps);
  vi.spyOn(builder, "addEntrypoint");

  const app = builder.with(lifecyclePlugin, (b) =>
    b.addFastifyEntrypoint("test", { host: "localhost", port: 3000 }, (b) => b),
  );

  expect(builder.addEntrypoint).toHaveBeenCalledOnce();
  const [name, fn] = vi.mocked(builder.addEntrypoint).mock.calls[0];
  expect(name).toBe("test");
  expect(fn(deps, hcManager)).toBeInstanceOf(FastifyEntrypoint);

  expectTypeOf(app.entrypoints.test).toEqualTypeOf<FastifyEntrypoint>();
});
