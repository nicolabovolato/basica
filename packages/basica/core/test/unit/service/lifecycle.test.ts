import { setTimeout } from "node:timers/promises";
import { loggerFactory } from "src/logger";
import { AppRequiredServices } from "src/service";
import {
  LifecycleManager,
  LifecycleManagerBuilder,
  LifecycleManagerConfig,
} from "src/service/lifecycle";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const logger = loggerFactory({ level: "silent" });
const config: LifecycleManagerConfig = {
  startupTimeoutMs: 1000,
  shutdownTimeoutMs: 1000,
};
const services = { logger } satisfies AppRequiredServices;

// let mockExit: MockInstance<Parameters<typeof process.exit>, never[]>;

beforeEach(() => {
  //vi.useFakeTimers(); // TODO: timers/promises and AbortSignal are not mocked https://github.com/vitest-dev/vitest/issues/3088
  // mockExit = vi.spyOn(process, "exit").mockImplementation((async () => {
  //   // do nothing
  // }) as any);
});

afterEach(() => {
  //vi.useRealTimers();
  vi.restoreAllMocks();
});

test.todo("config"); // TODO: test config

test("builder", async () => {
  const start1 = vi.fn();
  const shutdown1 = vi.fn();
  const start2 = vi.fn();
  const shutdown2 = vi.fn();
  const healthcheck1 = vi.fn().mockResolvedValue({ status: "healthy" });
  const healthcheck2 = vi.fn().mockResolvedValue({ status: "unhealthy" });

  const m = new LifecycleManagerBuilder(services, config)
    .addEntrypoint("entrypoint", () => ({
      start: start1,
      shutdown: shutdown1,
      healthcheck: healthcheck1,
    }))
    .addService("startup", () => ({ start: start2 }))
    .addService("shutdown", () => ({
      shutdown: shutdown2,
      healthcheck: healthcheck2,
    }));

  const manager = m.build();

  await m.healthchecks.healthcheck();
  expect(healthcheck1).toHaveBeenCalledOnce();
  expect(healthcheck2).toHaveBeenCalledOnce();

  await manager.start();
  expect(start1).toHaveBeenCalledOnce();
  expect(start2).toHaveBeenCalledOnce();

  await manager.stop();
  expect(shutdown1).toHaveBeenCalledOnce();
  expect(shutdown2).toHaveBeenCalledOnce();
});

test("start ok", async () => {
  const start = vi.fn();
  const manager = new LifecycleManager(
    logger,
    [
      {
        name: "test",
        svc: { start },
      },
    ],
    [],
    config
  );

  const result = await manager.start();
  expect(result).toBe(true);

  expect(start).toHaveBeenCalledOnce();
});

test("start failure", async () => {
  const start = vi.fn().mockRejectedValue(new Error("test error"));
  const manager = new LifecycleManager(
    logger,
    [
      {
        name: "test",
        svc: { start },
      },
    ],
    [],
    config
  );

  const result = await manager.start();
  expect(result).toEqual(false);

  expect(start).toHaveBeenCalledOnce();
});

test("start failure, stops started, timedout and not startable services", async () => {
  const start1 = vi.fn().mockRejectedValue(new Error("test error"));
  const start2 = vi.fn();
  const start3 = vi.fn().mockImplementation(async () => await setTimeout(2000));
  const start4 = vi.fn();
  const shutdown1 = vi.fn();
  const shutdown2 = vi.fn();
  const shutdown3 = vi.fn();
  const shutdown4 = vi.fn();
  const manager = new LifecycleManager(
    logger,
    [
      {
        name: "failing-entrypoint",
        svc: { start: start1, shutdown: shutdown1 },
      },
      {
        name: "successful-entrypoint",
        svc: { start: start2, shutdown: shutdown2 },
      },
      {
        name: "timingout-entrypoint",
        svc: { start: start3, shutdown: shutdown3 },
      },
      {
        name: "graceful",
        svc: { shutdown: shutdown4 },
      },
      {
        name: "one-shot",
        svc: { start: start4 },
      },
    ],
    [],
    config
  );

  const result = await manager.start();
  expect(result).toEqual(false);

  expect(start1).toHaveBeenCalledOnce();
  expect(start2).toHaveBeenCalledOnce();
  expect(start3).toHaveBeenCalledOnce();
  expect(start4).toHaveBeenCalledOnce();

  expect(shutdown1).not.toHaveBeenCalled();
  expect(shutdown2).toHaveBeenCalledOnce();
  expect(shutdown3).toHaveBeenCalledOnce();
  expect(shutdown4).toHaveBeenCalled();
});

test("stop ok", async () => {
  const shutdown = vi.fn();
  const manager = new LifecycleManager(
    logger,
    [
      {
        name: "test",
        svc: { shutdown },
      },
    ],
    [],
    config
  );

  const result = await manager.stop();
  expect(result).toBe(true);

  expect(shutdown).toHaveBeenCalledOnce();
});

test("stop failure", async () => {
  const shutdown = vi.fn().mockRejectedValue(new Error("test error"));
  const manager = new LifecycleManager(
    logger,
    [
      {
        name: "test",
        svc: { shutdown },
      },
    ],
    [],
    config
  );

  const result = await manager.stop();
  expect(result).toBe(false);

  expect(shutdown).toHaveBeenCalledOnce();
});

test("invocation order", async () => {
  const startsvc1 = vi.fn();
  const startsvc2 = vi.fn();
  const startentrypoint = vi.fn();
  const shutdownsvc1 = vi.fn();
  const shutdownsvc2 = vi.fn();
  const shutdownentrypoint = vi.fn();

  const manager = new LifecycleManager(
    logger,
    [
      {
        name: "svc1",
        svc: { start: startsvc1, shutdown: shutdownsvc1 },
      },
      {
        name: "svc2",
        svc: { start: startsvc2, shutdown: shutdownsvc2 },
      },
    ],
    [
      {
        name: "entrypoint",
        svc: { start: startentrypoint, shutdown: shutdownentrypoint },
      },
    ],
    config
  );

  const start = await manager.start();
  expect(start).toBe(true);

  expect(startsvc1).toHaveBeenCalledOnce();
  expect(startsvc2).toHaveBeenCalledOnce();
  expect(startentrypoint).toHaveBeenCalledOnce();
  expect(startentrypoint.mock.invocationCallOrder[0]).toBeGreaterThan(
    startsvc1.mock.invocationCallOrder[0]
  );
  expect(startentrypoint.mock.invocationCallOrder[0]).toBeGreaterThan(
    startsvc2.mock.invocationCallOrder[0]
  );

  const stop = await manager.stop();
  expect(stop).toBe(true);
  expect(shutdownsvc1).toHaveBeenCalledOnce();
  expect(shutdownsvc2).toHaveBeenCalledOnce();
  expect(shutdownentrypoint).toHaveBeenCalledOnce();
  expect(shutdownentrypoint.mock.invocationCallOrder[0]).toBeLessThan(
    shutdownsvc1.mock.invocationCallOrder[0]
  );
  expect(shutdownentrypoint.mock.invocationCallOrder[0]).toBeLessThan(
    shutdownsvc2.mock.invocationCallOrder[0]
  );
});
