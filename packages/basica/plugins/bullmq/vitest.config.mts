import { defineConfig, mergeConfig } from "vitest/config";
import shared from "@basica/vitest-config/base.js";

export default mergeConfig(
  shared,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: "unit",
            include: ["test/unit/**/*.test.ts"],
          },
        },
        {
          extends: true,
          test: {
            name: "integration",
            include: ["test/integration/**/*.test.ts"],
            // one shared redis container for all integration files
            globalSetup: ["./test/integration/setup.ts"],
          },
        },
      ],
    },
  }),
);
