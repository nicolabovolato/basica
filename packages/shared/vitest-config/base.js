import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

/** @type {import("vitest").UserConfig} */
const config = defineConfig({
  test: {
    coverage: {
      enabled: true,
      all: true,
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src"],
    },
  },
  plugins: [tsconfigPaths()],
});

export default config;
