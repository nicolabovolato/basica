# @basica/fastify

## 0.1.3

### Patch Changes

- [#22](https://github.com/nicolabovolato/basica/pull/22) [`2d2ea5f`](https://github.com/nicolabovolato/basica/commit/2d2ea5f12d7ba22530f634f16ac5dff08cc9fa9e) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Configuration now uses [Standard Schema](https://standardschema.dev) instead of TypeBox.

  **Breaking:**

  - `configure(provider, schema)` accepts any Standard Schema and validates through the schema's own `~standard.validate`; `@basica/config` no longer depends on `@sinclair/typebox`.
  - The config schemas shipped by `@basica/core` and the plugins (`loggerConfigSchema`, `pgConfigSchema`, `fastifyConfigSchema`, etc.) are now [Zod](https://zod.dev) schemas. Install `zod` and compose them with `z.object(...)` instead of `Type.Object(...)`.
  - Reading configuration from environment variables requires a schema that also exposes a [Standard JSON Schema](https://standardschema.dev/json-schema) (Zod v4 does).

  **New:**

  - `envProvider({ dotenv: false })` skips loading a `.env` file entirely.
  - `ConfigProvider` is now generic in the schema it consumes: shaped providers (object, file, remote) work with any Standard Schema, while flat-source providers like `envProvider` require a Standard JSON Schema.

- [#25](https://github.com/nicolabovolato/basica/pull/25) [`2ba076c`](https://github.com/nicolabovolato/basica/commit/2ba076cd5077f40281c2c8d69e091fd40fe94ea6) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Update runtime dependencies:

  - `@basica/config`: dotenv 17. `envProvider` now defaults dotenv to `{ quiet: true }` (user-overridable), so dotenv v17's startup summary line isn't printed.
  - `@basica/core`: pino 10, close-with-grace 2.
  - `@basica/fastify`: fastify 5.10, @fastify/swagger 9.8, @fastify/swagger-ui 6. fastify 5.10 types the error-handler error as `unknown`; the plugin's error handlers cast it.

- Updated dependencies [[`2d2ea5f`](https://github.com/nicolabovolato/basica/commit/2d2ea5f12d7ba22530f634f16ac5dff08cc9fa9e), [`8d09987`](https://github.com/nicolabovolato/basica/commit/8d09987f6590e7743fc6fc916b8a21f8723469f5), [`2ba076c`](https://github.com/nicolabovolato/basica/commit/2ba076cd5077f40281c2c8d69e091fd40fe94ea6)]:
  - @basica/core@0.0.6

## 0.1.2

### Patch Changes

- [#19](https://github.com/nicolabovolato/basica/pull/19) [`730dc6b`](https://github.com/nicolabovolato/basica/commit/730dc6b4937882566a7842050dc4758ed884e24c) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Require Node.js 24 as the minimum supported version and update dependencies to their latest compatible releases.

- Updated dependencies [[`730dc6b`](https://github.com/nicolabovolato/basica/commit/730dc6b4937882566a7842050dc4758ed884e24c)]:
  - @basica/core@0.0.5

## 0.1.1

### Patch Changes

- [`5e03067`](https://github.com/nicolabovolato/basica/commit/5e030679b028c9afeadd6d5275064cd79721b874) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - fix: useOpenapi

## 0.1.0

### Minor Changes

- [#14](https://github.com/nicolabovolato/basica/pull/14) [`baa072d`](https://github.com/nicolabovolato/basica/commit/baa072d792823a51f823ff0121e653ed66547281) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Bump to fastify v5

## 0.0.4

### Patch Changes

- [#11](https://github.com/nicolabovolato/basica/pull/11) [`fc0c82e`](https://github.com/nicolabovolato/basica/commit/fc0c82ed38a8045cbb485241054a230a48a1f70e) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - better typing and testing support

- Updated dependencies [[`fc0c82e`](https://github.com/nicolabovolato/basica/commit/fc0c82ed38a8045cbb485241054a230a48a1f70e)]:
  - @basica/core@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies [[`faf713a`](https://github.com/nicolabovolato/basica/commit/faf713aa3a687e3dd046154e317992568942d139)]:
  - @basica/core@0.0.3

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
