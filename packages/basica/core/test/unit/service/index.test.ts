import { ILogger, loggerFactory } from "src/logger";
import { App, AppBuilder } from "src/service";
import { ILifecycleManager } from "src/service/lifecycle";
import { MockInstance, afterEach, beforeEach, expect, test, vi } from "vitest";

const logger = loggerFactory({ level: "silent" });
const lifecycle = {
  config: { startupTimeoutMs: 1000, shutdownTimeoutMs: 1000 },
  start: vi.fn(),
  stop: vi.fn(),
} satisfies ILifecycleManager;

let mockExit: MockInstance<typeof process.exit>;

beforeEach(() => {
  //vi.useFakeTimers(); // TODO: timers/promises and AbortSignal are not mocked https://github.com/vitest-dev/vitest/issues/3088
  mockExit = vi.spyOn(process, "exit").mockImplementation((async () => {
    //do nothing
  }) as never);
});

afterEach(() => {
  //vi.useRealTimers();
  vi.restoreAllMocks();
});

test("registerDependencies can be called with no dependencies", () => {
  const app = AppBuilder.registerDependencies().build();

  expect(typeof app.deps.logger.info).toBe("function");
});

test("registerDependencies lets you override the default logger", () => {
  const myLogger = loggerFactory({ level: "silent" });

  const app = AppBuilder.registerDependencies((di) =>
    di.addSingleton("logger", () => myLogger),
  ).build();

  expect(app.deps.logger).toBe(myLogger);
});

test("registerDependencies exposes the seeded logger to sibling factories", () => {
  const app = AppBuilder.registerDependencies((di) =>
    di.addSingleton("svc", (deps) => ({ log: deps.logger as ILogger })),
  ).build();

  expect(app.deps.svc.log).toBe(app.deps.logger);
});

test.todo("app ok", async () => {
  lifecycle.start.mockResolvedValue(true);
  lifecycle.stop.mockResolvedValue(true);

  const app = new App({ logger }, {}, {}, {}, lifecycle);
  await app.run();

  expect(lifecycle.start).toHaveBeenCalledOnce();

  //TODO: how to test beforeExit?
  expect(lifecycle.stop).not.toHaveBeenCalledOnce();
  expect(mockExit).not.toHaveBeenCalled();
});

// test("app start error", async () => {
//   lifecycle.start.mockResolvedValue(false);
//   lifecycle.stop.mockResolvedValue(true);

//   const app = new App(logger, lifecycle);
//   await app.run();

//   expect(lifecycle.start).toHaveBeenCalledOnce();
//   expect(lifecycle.stop).toHaveBeenCalledOnce();

//   expect(mockExit).toHaveBeenCalledOnce();
//   expect(mockExit).toHaveBeenCalledWith(1);
// });

// test("app stop error", async () => {
//   lifecycle.start.mockResolvedValue(true);
//   lifecycle.stop.mockResolvedValue(false);

//   const app = new App(logger, lifecycle);
//   await app.run();

//   expect(lifecycle.start).toHaveBeenCalledOnce();
//   expect(lifecycle.stop).toHaveBeenCalledOnce();

//   expect(mockExit).toHaveBeenCalledOnce();
//   expect(mockExit).toHaveBeenCalledWith(1);
// });

// test.todo("app graceful shutdown", async () => {
//   lifecycle.start.mockImplementation(async () => await setTimeout(10000, true));
//   lifecycle.stop.mockResolvedValue(true);

//   const app = new App(logger, lifecycle);
//   // process.kill(process.pid, "SIGINT");
//   await app.run();

//   expect(lifecycle.start).toHaveBeenCalledOnce();
//   expect(lifecycle.stop).toHaveBeenCalledOnce();

//   expect(mockExit).not.toHaveBeenCalled();
// });
