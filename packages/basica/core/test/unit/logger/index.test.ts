import { Logger } from "pino";
import { LoggerConfig, loggerFactory } from "src/logger";
import { test, expect } from "vitest";

test.each([{ level: "info" }, { level: "debug" }, {}] as LoggerConfig[])(
  "config",
  async (config) => {
    const logger = loggerFactory(config) as Logger;
    expect(logger.level).toEqual(config.level ?? "info");
  }
);
