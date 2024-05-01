import { IHealthcheckManager } from "@basica/core";
import { loggerFactory } from "@basica/core/logger";
import { vi } from "vitest";

export const logger = loggerFactory({ level: "silent" });

export const deps = { logger };

export const hcManager = {
  healthcheck: vi.fn(),
} satisfies IHealthcheckManager;
