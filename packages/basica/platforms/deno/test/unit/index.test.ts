import type { IApplication, ILifecycleManager } from "@basica/core";
import { loggerFactory } from "@basica/core/logger";
import { afterEach, beforeEach, expect, test, vi, type Mock } from "vitest";

import { run } from "src/index";

// vitest runs on Node, so the Deno globals are stubbed here; the real signal
// wiring is covered by the integration test (spawned under deno).
const logger = loggerFactory({ level: "silent" });

let mockExit: Mock;
let signalHandlers: Partial<Record<string, () => void>>;

beforeEach(() => {
  mockExit = vi.fn();
  signalHandlers = {};
  vi.stubGlobal("Deno", {
    addSignalListener: (signal: string, handler: () => void) => {
      signalHandlers[signal] = handler;
    },
    exit: mockExit,
  });
  // run() installs an unhandledrejection listener; Node's globalThis may not
  // expose addEventListener, so provide a no-op for the duration of the test.
  vi.stubGlobal("addEventListener", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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
  expect(mockExit).not.toHaveBeenCalled();
});

test("exits with code 1 when startup fails", async () => {
  const a = app({ start: false, stop: true });

  await run(a);

  expect(a.lifecycle.start).toHaveBeenCalledOnce();
  expect(mockExit).toHaveBeenCalledWith(1);
});

test("stops the lifecycle and exits 0 on a signal", async () => {
  const a = app({ start: true, stop: true });

  await run(a);
  signalHandlers.SIGTERM?.();

  await vi.waitFor(() => expect(mockExit).toHaveBeenCalledWith(0));
  expect(a.lifecycle.stop).toHaveBeenCalledOnce();
});

test("exits with code 1 when shutdown fails", async () => {
  const a = app({ start: true, stop: false });

  await run(a);
  signalHandlers.SIGTERM?.();

  await vi.waitFor(() => expect(mockExit).toHaveBeenCalledWith(1));
  expect(a.lifecycle.stop).toHaveBeenCalledOnce();
});
