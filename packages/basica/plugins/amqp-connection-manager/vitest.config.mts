import { defineConfig, mergeConfig } from "vitest/config";
import shared from "@basica/vitest-config/base.js";

export default mergeConfig(
  shared,
  defineConfig({
    test: {
      pool: "forks",
      // Integration tests each spin up their own container; running the
      // files in parallel contends for Docker resources and flakes the
      // container health checks. Start them one at a time.
      fileParallelism: false,
    },
  })
);
