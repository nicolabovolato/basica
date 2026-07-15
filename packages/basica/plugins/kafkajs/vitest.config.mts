import { defineConfig, mergeConfig } from "vitest/config";
import shared from "@basica/vitest-config/base.js";

export default mergeConfig(
  shared,
  defineConfig({
    test: {
      pool: "forks",
      // integration files each start a heavy cp-kafka container; run them
      // sequentially to avoid container contention (matches amqp/ioredis)
      fileParallelism: false,
    },
  })
);
