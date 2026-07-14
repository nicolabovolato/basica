/** @type {import("tsup").Options} */
const config = {
  format: ["cjs", "esm"],
  clean: true,
  minify: true,
  // tsup always injects baseUrl: "." into the dts compile, which TS 6
  // deprecates; silence it here since we can't remove tsup's injected value.
  dts: { compilerOptions: { ignoreDeprecations: "6.0" } },
};

export default config;
