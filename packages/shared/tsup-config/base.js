/** @type {import("tsup").Options} */
const config = {
  format: ["cjs", "esm"],
  clean: true,
  minify: true,
  dts: true,
};

export default config;
