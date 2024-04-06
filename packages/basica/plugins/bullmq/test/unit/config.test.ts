import { expect, test } from "vitest";

import { isClusterWrapperConfig } from "src/config";

test.each([
  [{ url: "redis://localhost:6379", timeout: 1000 }, false],
  [{ nodes: [{ host: "localhost", port: 6379 }], timeout: 1000 }, true],
])("isClusterWrapperConfig", async (cfg, expected) => {
  const result = isClusterWrapperConfig(cfg);
  expect(result).toBe(expected);
});
