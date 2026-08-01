# @basica/kafkajs

## 0.0.6

### Patch Changes

- [#36](https://github.com/nicolabovolato/basica/pull/36) [`7514233`](https://github.com/nicolabovolato/basica/commit/75142338387538ed62bdbc7d2ac22520bfc23e63) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Fix several bugs that only surface when a kafka consumer runs through a real app lifecycle (`app.lifecycle.start()`/`stop()`):

  - The kafkajs→pino `logCreator` returned a **detached** pino method reference and called it standalone, so as soon as the logger actually emitted (any non-silent logger) it lost pino's `this` and threw `Cannot read properties of undefined (reading 'Symbol(pino.msgPrefix)')`. It now calls the pino log method directly (method invocation keeps `this`).
  - `KafkaConsumerEntrypoint.shutdown()` called the raw kafkajs `stop()` (halt consuming without disconnecting) instead of `disconnect()`, so the consumer never left the group and lifecycle shutdown timed out. It now disconnects.
  - `start()` now waits for the consumer to join the group before returning, so it reports started only once assigned and fetching — and a fast start/stop no longer races the join.

  Note: a kafka consumer's graceful disconnect takes several seconds (leave group + finish the in-flight fetch long-poll), so apps with a kafka consumer should raise `shutdownTimeoutMs` above the 5s default.

- [#28](https://github.com/nicolabovolato/basica/pull/28) [`515ad3b`](https://github.com/nicolabovolato/basica/commit/515ad3be8c2bbe5de6c0bd763c994e6b63765e3b) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Widen each third-party `peerDependency` to the widest honest range — `>=<earliest version whose API the plugin actually uses> <<next breaking major>>` — determined from the concrete API surface each plugin depends on:

  - **kysely** `>=0.29.0 <0.30.0` — needs the `kysely/migration` subpath export, first added in 0.29.0 (0.x, so capped at the next minor since the plugin subclasses `Kysely`/`Migrator`)
  - **pg** `>=8.0.0 <9.0.0` — needs the ES6-class `Pool`/`Client` that `extends` relies on, shipped in 8.0.0
  - **ioredis** `>=5.3.0 <6.0.0` — needs sharded pub/sub (`ssubscribe`/`sunsubscribe`), added in 5.3.0
  - **kafkajs** `>=2.0.0 <3.0.0` — needs the `enforceRequestTimeout` config field, added in 2.0.0
  - **amqp-connection-manager** `>=4.0.0 <5.0.0` — needs the `connectFailed` event, added in 4.0.0; **amqplib** `>=0.10.0 <0.11.0` (0.x → next-minor cap; 0.10.0 is the promise-rewrite boundary)
  - **bullmq** `>=5.0.0 <6.0.0` — all surface used is stable since 5.0.0

  `@basica/bullmq` and `@basica/ioredis` declare the identical `ioredis` range so a consumer resolves a single ioredis copy (bullmq's `connection instanceof Redis`/`Cluster` checks depend on it).

  Also removes the redundant `@basica/ioredis` entry from `@basica/bullmq`'s `dependencies` — it is already a `peerDependency`.

- Updated dependencies [[`4921f0c`](https://github.com/nicolabovolato/basica/commit/4921f0c9ee737fb7dc7f03811668ededeb412d6c), [`79f53e7`](https://github.com/nicolabovolato/basica/commit/79f53e777f6fed73e0a9a3762a3b305bb4354da6), [`0d9a18c`](https://github.com/nicolabovolato/basica/commit/0d9a18cb26964b3903b6007a72e8b8c04b0872cf), [`ab3190f`](https://github.com/nicolabovolato/basica/commit/ab3190f6f2f258409e3a58cbfe6fb1f906aaf3cc), [`3007746`](https://github.com/nicolabovolato/basica/commit/3007746d430ca8689ee3f13d34dd265fdd1788d8)]:
  - @basica/core@0.0.8

## 0.0.5

### Patch Changes

- Updated dependencies [[`76a83c6`](https://github.com/nicolabovolato/basica/commit/76a83c678a7597d3ae5c860baf961c41e8c2a781), [`76a83c6`](https://github.com/nicolabovolato/basica/commit/76a83c678a7597d3ae5c860baf961c41e8c2a781)]:
  - @basica/core@0.0.7

## 0.0.4

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

## 0.0.3

### Patch Changes

- [#19](https://github.com/nicolabovolato/basica/pull/19) [`730dc6b`](https://github.com/nicolabovolato/basica/commit/730dc6b4937882566a7842050dc4758ed884e24c) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Require Node.js 24 as the minimum supported version and update dependencies to their latest compatible releases.

- Updated dependencies [[`730dc6b`](https://github.com/nicolabovolato/basica/commit/730dc6b4937882566a7842050dc4758ed884e24c)]:
  - @basica/core@0.0.5

## 0.0.2

### Patch Changes

- [#11](https://github.com/nicolabovolato/basica/pull/11) [`fc0c82e`](https://github.com/nicolabovolato/basica/commit/fc0c82ed38a8045cbb485241054a230a48a1f70e) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - better typing and testing support

- Updated dependencies [[`fc0c82e`](https://github.com/nicolabovolato/basica/commit/fc0c82ed38a8045cbb485241054a230a48a1f70e)]:
  - @basica/core@0.0.4

## 0.0.1

### Patch Changes

- [#8](https://github.com/nicolabovolato/basica/pull/8) [`faf713a`](https://github.com/nicolabovolato/basica/commit/faf713aa3a687e3dd046154e317992568942d139) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - add kafkajs plugin

- Updated dependencies [[`faf713a`](https://github.com/nicolabovolato/basica/commit/faf713aa3a687e3dd046154e317992568942d139)]:
  - @basica/core@0.0.3
