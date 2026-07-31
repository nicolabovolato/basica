import type { IApplication, ILifecycleManager } from "@basica/core";
import { loggerFactory } from "@basica/core/logger";
import closeWithGrace, {
  type CloseWithGraceAsyncCallback,
} from "close-with-grace";
import {
  afterEach,
  beforeEach,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";

import { run } from "src/index";

// Mock close-with-grace so the real signal handlers are never installed and we
// can invoke the shutdown handler `run()` registers directly. The real signal
// wiring is covered by the cross-runtime integration test instead.
vi.mock("close-with-grace");

const logger = loggerFactory({ level: "silent" });

let mockExit: MockInstance<typeof process.exit>;
let shutdown: CloseWithGraceAsyncCallback;

beforeEach(() => {
  mockExit = vi.spyOn(process, "exit").mockImplementation((() => {}) as never);
  vi.mocked(closeWithGrace).mockImplementation((...args: unknown[]) => {
    shutdown = args[1] as CloseWithGraceAsyncCallback;
    return { close: vi.fn(), uninstall: vi.fn() };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  // `run()` registers a real `beforeExit` listener; drop it between tests.
  process.removeAllListeners("beforeExit");
});

const app = (opts: { start: boolean; stop: boolean }) => {
  const lifecycle = {
    config: { startupTimeoutMs: 1000, shutdownTimeoutMs: 1000 },
    start: vi.fn(async () => opts.start),
    stop: vi.fn(async () => opts.stop),
  } satisfies ILifecycleManager;

  return {
    deps: { logger },
    healthchecks: {},
    services: {},
    entrypoints: {},
    lifecycle,
  } satisfies IApplication;
};

test("starts the lifecycle without exiting on success", async () => {
  const a = app({ start: true, stop: true });

  await run(a);

  expect(a.lifecycle.start).toHaveBeenCalledOnce();
  expect(a.lifecycle.stop).not.toHaveBeenCalledOnce();
  expect(mockExit).not.toHaveBeenCalled();
});

test("exits with code 1 when startup fails", async () => {
  const a = app({ start: false, stop: true });

  await run(a);

  expect(a.lifecycle.start).toHaveBeenCalledOnce();
  expect(a.lifecycle.stop).not.toHaveBeenCalledOnce();
  expect(mockExit).toHaveBeenCalledWith(1);
});

test("stops the lifecycle on shutdown", async () => {
  const a = app({ start: true, stop: true });

  await run(a);
  await shutdown({ signal: "SIGTERM" });

  expect(a.lifecycle.start).toHaveBeenCalledOnce();
  expect(a.lifecycle.stop).toHaveBeenCalledOnce();
  expect(mockExit).not.toHaveBeenCalled();
});

test("exits with code 1 when shutdown fails", async () => {
  const a = app({ start: true, stop: false });

  await run(a);
  await shutdown({ manual: true });

  expect(a.lifecycle.start).toHaveBeenCalledOnce();
  expect(a.lifecycle.stop).toHaveBeenCalledOnce();
  expect(mockExit).toHaveBeenCalledWith(1);
});
