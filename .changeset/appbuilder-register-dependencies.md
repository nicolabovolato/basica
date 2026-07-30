---
"@basica/core": patch
---

Add `AppBuilder.registerDependencies` as the recommended entry point for building an app.

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
