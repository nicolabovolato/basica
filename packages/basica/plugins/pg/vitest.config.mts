import { defineConfig, mergeConfig } from "vitest/config";
import shared from "@basica/vitest-config/base.js";

export default mergeConfig(
  shared,
  defineConfig({
    test: {
      // integration-only package: one shared postgres container for all tests
      globalSetup: ["./test/integration/setup.ts"],
    },
  }),
);
