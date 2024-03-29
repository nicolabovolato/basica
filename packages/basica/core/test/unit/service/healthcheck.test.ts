import { setTimeout } from "node:timers/promises";
import { loggerFactory } from "src/logger";
import { AppRequiredServices } from "src/service";
import {
  HealthcheckManager,
  HealthcheckManagerBuilder,
  HealthcheckManagerConfig,
} from "src/service/healthcheck";
import { test, expect, vi, afterEach, beforeEach } from "vitest";

const config: HealthcheckManagerConfig = {
  timeoutMs: 1000,
};
const logger = loggerFactory({ level: "silent" });
const services = { logger } satisfies AppRequiredServices;

beforeEach(() => {
  //vi.useFakeTimers(); // TODO: timers/promises and AbortSignal are not mocked https://github.com/vitest-dev/vitest/issues/3088
});

afterEach(() => {
  //vi.useRealTimers();
});

test.todo("config"); // TODO: test config

test("builder", async () => {
  const hc1 = vi.fn().mockResolvedValue({ status: "healthy" });
  const hc2 = vi.fn().mockResolvedValue({ status: "healthy" });

  const manager = new HealthcheckManagerBuilder(services, config)
    .addHealthcheck("test1", () => ({
      healthcheck: hc1,
    }))
    .addHealthcheck("test2", () => ({
      healthcheck: hc2,
    }))
    .build();

  const result = await manager.healthcheck();
  expect(result).toEqual({
    test1: { status: "healthy" },
    test2: { status: "healthy" },
  });
  expect(hc1).toHaveBeenCalledOnce();
  expect(hc2).toHaveBeenCalledOnce();
});

test("healthy", async () => {
  const hc = vi.fn().mockResolvedValue({
    status: "healthy",
  });
  const manager = new HealthcheckManager(
    logger,
    [{ name: "test", value: { healthcheck: hc } }],
    config
  );

  const result = await manager.healthcheck();

  expect(result).toEqual({ test: { status: "healthy" } });
  expect(hc).toHaveBeenCalledOnce();
});

test("unhealthy", async () => {
  const hc = vi.fn().mockResolvedValue({
    status: "unhealthy",
    description: "test description",
  });

  const manager = new HealthcheckManager(
    logger,
    [{ name: "test", value: { healthcheck: hc } }],
    config
  );

  const result = await manager.healthcheck();

  expect(result).toEqual({
    test: { status: "unhealthy", description: "test description" },
  });
  expect(hc).toHaveBeenCalledOnce();
});

test("throw", async () => {
  const hc = vi.fn().mockRejectedValue(new Error("test error"));

  const manager = new HealthcheckManager(
    logger,
    [{ name: "test", value: { healthcheck: hc } }],
    config
  );

  const result = await manager.healthcheck();

  expect(result).toEqual({
    test: { status: "unhealthy", error: new Error("test error") },
  });
  expect(hc).toHaveBeenCalledOnce();
});

test("filter", async () => {
  const hc1 = vi.fn().mockResolvedValue({
    status: "healthy",
  });

  const hc2 = vi.fn().mockResolvedValue({
    status: "healthy",
  });

  const manager = new HealthcheckManager(
    logger,
    [
      { name: "test", value: { healthcheck: hc1 } },
      { name: "test2", value: { healthcheck: hc2 } },
    ],
    config
  );

  const result = await manager.healthcheck((name) => name == "test");

  expect(result).toEqual({
    test: {
      status: "healthy",
    },
  });
  expect(hc1).toHaveBeenCalledOnce();
  expect(hc2).not.toHaveBeenCalled();
});

test("abort", async () => {
  const manager = new HealthcheckManager(
    logger,
    [
      {
        name: "test",
        value: {
          healthcheck: (signal) => setTimeout(2000, { status: "healthy" }),
        },
      },
    ],
    config
  );

  const result = await manager.healthcheck();

  expect(result).toEqual({
    test: {
      status: "unhealthy",
      error: expect.any(DOMException),
    },
  });
});
