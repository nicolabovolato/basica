import { defineConfig } from "tsup";

import defaults from "@basica/tsup-config/base.js";

export default defineConfig({
  ...defaults,
  entry: ["src/index.ts"],
});
