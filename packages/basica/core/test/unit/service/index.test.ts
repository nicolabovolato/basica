import { ILogger, loggerFactory } from "src/logger";
import { AppBuilder } from "src/service";
import { expect, test } from "vitest";

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
