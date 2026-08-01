# @basica/core

## 0.0.8

### Patch Changes

- [#32](https://github.com/nicolabovolato/basica/pull/32) [`4921f0c`](https://github.com/nicolabovolato/basica/commit/4921f0c9ee737fb7dc7f03811668ededeb412d6c) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Add `AppBuilder.registerDependencies` as the recommended entry point for building an app.

  It collapses the `new IocContainer()` + `new AppBuilder(container)` dance into a single static call (the `new AppBuilder(container)` constructor still works). The container passed to the callback is pre-seeded with a default `logger`, so `deps.logger` is always available — override it by registering your own `"logger"` first. The callback is optional: `AppBuilder.registerDependencies()` builds an app that only needs the default logger.

  Before:

  ```ts
  const container = new IocContainer()
    .addSingleton("logger", () => loggerFactory(config.logger))
    .addSingleton("db", (deps) => new Db(deps.logger));

  const app = new AppBuilder(container).configureLifecycle(/* ... */).build();
  ```

  After:

  ```ts
  const app = AppBuilder.registerDependencies((di) =>
    di
      .addSingleton("logger", () => loggerFactory(config.logger)) // optional override
      .addSingleton("db", (deps) => new Db(deps.logger)),
  )
    .configureLifecycle(/* ... */)
    .build();
  ```

- [#34](https://github.com/nicolabovolato/basica/pull/34) [`79f53e7`](https://github.com/nicolabovolato/basica/commit/79f53e777f6fed73e0a9a3762a3b305bb4354da6) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Rename the `App` class to `Application`, add an exported `IApplication` interface it implements, and remove `Application.run()`.

  `IApplication` is the minimal built-application contract — `deps`, `healthchecks`, `services`, `entrypoints`, `lifecycle` — that lets a platform runner drive an app without depending on its concrete generic types.

  Running an app now lives in a per-platform package rather than in core, so core no longer depends on `close-with-grace` or calls `process.exit`. Replace `app.run()` with a runner:

  ```ts
  import { run } from "@basica/platform-node";

  run(getApp());
  ```

- [#29](https://github.com/nicolabovolato/basica/pull/29) [`0d9a18c`](https://github.com/nicolabovolato/basica/commit/0d9a18cb26964b3903b6007a72e8b8c04b0872cf) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Clearer application lifecycle logging. On startup the manager now logs a one-line pre-flight summary of everything it manages — e.g. `Lifecycle: 2 service(s) (1 startable, 1 stoppable), 1 entrypoint(s) (1 startable, 1 stoppable)` — before starting anything, and the per-phase lines drop the confusing `N/N` counts (previously you'd see `Starting 1/1 service(s)` even after registering more). Shutdown also no longer logs a `No <kind>(s) to stop` line for empty collections (matching startup, which stays silent for them). Also fixes a shutdown-failure log/span message that incorrectly read "Failed to start".

- [#29](https://github.com/nicolabovolato/basica/pull/29) [`ab3190f`](https://github.com/nicolabovolato/basica/commit/ab3190f6f2f258409e3a58cbfe6fb1f906aaf3cc) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Fix start-failure rollback stopping the wrong items. When startup failed, the lifecycle manager applied the "only stop these" partial set to the bottom collection instead of the failure-level one — so it called `shutdown` on the item that had just failed to start (and on its whole collection) while skipping the items below it that had actually started. Now a failed-to-start item is left alone and everything that did start is rolled back correctly.

- [#31](https://github.com/nicolabovolato/basica/pull/31) [`3007746`](https://github.com/nicolabovolato/basica/commit/3007746d430ca8689ee3f13d34dd265fdd1788d8) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - The app's registered item maps — `app.deps` / `app.services` / `app.entrypoints` / `app.healthchecks` — are now readonly, at both the type level and at runtime.

  - The accumulator generics that fall back to a default (`IocContainer`, `AppBuilder`, `LifecycleManagerBuilder`) now default to a closed `Record<never, never>` instead of the `Record<string, unknown>` constraint. As a result `D`/`H`/`S`/`E` no longer carry a string index signature: reassigning or adding a key is a compile error. (Note: indexing with an _unregistered_ key now errors as "property does not exist" instead of resolving to `unknown` — `app.services["not-registered"]` is a type error rather than `unknown`.)
  - `IocContainer.items` returns a frozen shallow copy, so JS / `as any` callers can't mutate the map at runtime either.

  The registered items themselves are untouched — not frozen and not deeply readonly — so spying on and calling methods of `app.services.x` etc. works exactly as before.

## 0.0.7

### Patch Changes

- [#26](https://github.com/nicolabovolato/basica/pull/26) [`76a83c6`](https://github.com/nicolabovolato/basica/commit/76a83c678a7597d3ae5c860baf961c41e8c2a781) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - `LifecycleManagerBuilder.healthchecks` now returns the registered healthcheck items, symmetric with `services` and `entrypoints`. The manager that runs them is available through the new `healthcheckManager` getter.

- [#26](https://github.com/nicolabovolato/basica/pull/26) [`76a83c6`](https://github.com/nicolabovolato/basica/commit/76a83c678a7597d3ae5c860baf961c41e8c2a781) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Stop exporting the plugin registration internals (`RegisteredServices`, `RegisteredEntrypoints`, `RegisteredHealthchecks`, `LifecyclePluginRegistrations`) from `@basica/core/utils`.

## 0.0.6

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

- [#25](https://github.com/nicolabovolato/basica/pull/25) [`2ba076c`](https://github.com/nicolabovolato/basica/commit/2ba076cd5077f40281c2c8d69e091fd40fe94ea6) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Update runtime dependencies:

  - `@basica/config`: dotenv 17. `envProvider` now defaults dotenv to `{ quiet: true }` (user-overridable), so dotenv v17's startup summary line isn't printed.
  - `@basica/core`: pino 10, close-with-grace 2.
  - `@basica/fastify`: fastify 5.10, @fastify/swagger 9.8, @fastify/swagger-ui 6. fastify 5.10 types the error-handler error as `unknown`; the plugin's error handlers cast it.

## 0.0.5

### Patch Changes

- [#19](https://github.com/nicolabovolato/basica/pull/19) [`730dc6b`](https://github.com/nicolabovolato/basica/commit/730dc6b4937882566a7842050dc4758ed884e24c) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Require Node.js 24 as the minimum supported version and update dependencies to their latest compatible releases.

## 0.0.4

### Patch Changes

- [#11](https://github.com/nicolabovolato/basica/pull/11) [`fc0c82e`](https://github.com/nicolabovolato/basica/commit/fc0c82ed38a8045cbb485241054a230a48a1f70e) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - better typing and testing support

## 0.0.3

### Patch Changes

- [#8](https://github.com/nicolabovolato/basica/pull/8) [`faf713a`](https://github.com/nicolabovolato/basica/commit/faf713aa3a687e3dd046154e317992568942d139) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - change how healthchecks are registered

## 0.0.2

### Patch Changes

- [`2be61dc`](https://github.com/nicolabovolato/basica/commit/2be61dc95150d2e8eaadd8de562d18f0644c979c) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Fixed deps

## 0.0.1

### Patch Changes

- [`39fc149`](https://github.com/nicolabovolato/basica/commit/39fc14933b633a7ad0177e556bd03092d9f05815) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Initial version
