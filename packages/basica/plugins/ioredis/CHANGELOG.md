# @basica/ioredis

## 0.0.8

### Patch Changes

- [#22](https://github.com/nicolabovolato/basica/pull/22) [`2d2ea5f`](https://github.com/nicolabovolato/basica/commit/2d2ea5f12d7ba22530f634f16ac5dff08cc9fa9e) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Configuration now uses [Standard Schema](https://standardschema.dev) instead of TypeBox.

  **Breaking:**

  - `configure(provider, schema)` accepts any Standard Schema and validates through the schema's own `~standard.validate`; `@basica/config` no longer depends on `@sinclair/typebox`.
  - The config schemas shipped by `@basica/core` and the plugins (`loggerConfigSchema`, `pgConfigSchema`, `fastifyConfigSchema`, etc.) are now [Zod](https://zod.dev) schemas. Install `zod` and compose them with `z.object(...)` instead of `Type.Object(...)`.
  - Reading configuration from environment variables requires a schema that also exposes a [Standard JSON Schema](https://standardschema.dev/json-schema) (Zod v4 does).

  **New:**

  - `envProvider({ dotenv: false })` skips loading a `.env` file entirely.
  - `ConfigProvider` is now generic in the schema it consumes: shaped providers (object, file, remote) work with any Standard Schema, while flat-source providers like `envProvider` require a Standard JSON Schema.

- [#25](https://github.com/nicolabovolato/basica/pull/25) [`8d09987`](https://github.com/nicolabovolato/basica/commit/8d09987f6590e7743fc6fc916b8a21f8723469f5) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Migrate to OpenTelemetry v2. `@basica/telemetry`'s `TelemetryBuilder` now uses the v2 resource API (`resourceFromAttributes`) and `@opentelemetry/api` is bumped to 1.9.

- Updated dependencies [[`2d2ea5f`](https://github.com/nicolabovolato/basica/commit/2d2ea5f12d7ba22530f634f16ac5dff08cc9fa9e), [`8d09987`](https://github.com/nicolabovolato/basica/commit/8d09987f6590e7743fc6fc916b8a21f8723469f5), [`2ba076c`](https://github.com/nicolabovolato/basica/commit/2ba076cd5077f40281c2c8d69e091fd40fe94ea6)]:
  - @basica/core@0.0.6

## 0.0.7

### Patch Changes

- [#19](https://github.com/nicolabovolato/basica/pull/19) [`730dc6b`](https://github.com/nicolabovolato/basica/commit/730dc6b4937882566a7842050dc4758ed884e24c) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Require Node.js 24 as the minimum supported version and update dependencies to their latest compatible releases.

- Updated dependencies [[`730dc6b`](https://github.com/nicolabovolato/basica/commit/730dc6b4937882566a7842050dc4758ed884e24c)]:
  - @basica/core@0.0.5

## 0.0.6

### Patch Changes

- [#11](https://github.com/nicolabovolato/basica/pull/11) [`fc0c82e`](https://github.com/nicolabovolato/basica/commit/fc0c82ed38a8045cbb485241054a230a48a1f70e) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - better typing and testing support

- Updated dependencies [[`fc0c82e`](https://github.com/nicolabovolato/basica/commit/fc0c82ed38a8045cbb485241054a230a48a1f70e)]:
  - @basica/core@0.0.4

## 0.0.5

### Patch Changes

- Updated dependencies [[`faf713a`](https://github.com/nicolabovolato/basica/commit/faf713aa3a687e3dd046154e317992568942d139)]:
  - @basica/core@0.0.3

## 0.0.4

### Patch Changes

- [#6](https://github.com/nicolabovolato/basica/pull/6) [`36071a0`](https://github.com/nicolabovolato/basica/commit/36071a082275f1b66c502b817cae901c52ed4513) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - fix tracing

## 0.0.3

### Patch Changes

- [#4](https://github.com/nicolabovolato/basica/pull/4) [`e8f09ea`](https://github.com/nicolabovolato/basica/commit/e8f09ea5ed42e17a1d809ebd57bb859896b42782) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - add bullmq plugin

## 0.0.2

### Patch Changes

- [`2be61dc`](https://github.com/nicolabovolato/basica/commit/2be61dc95150d2e8eaadd8de562d18f0644c979c) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Fixed deps

- Updated dependencies [[`2be61dc`](https://github.com/nicolabovolato/basica/commit/2be61dc95150d2e8eaadd8de562d18f0644c979c)]:
  - @basica/core@0.0.2

## 0.0.1

### Patch Changes

- [`39fc149`](https://github.com/nicolabovolato/basica/commit/39fc14933b633a7ad0177e556bd03092d9f05815) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Initial version

- Updated dependencies [[`39fc149`](https://github.com/nicolabovolato/basica/commit/39fc14933b633a7ad0177e556bd03092d9f05815)]:
  - @basica/core@0.0.1
