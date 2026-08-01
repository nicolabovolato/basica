---
"@basica/bullmq": patch
---

The worker no longer connects to redis at construction / `build()` time. `new Worker(...)` opens its redis connection immediately — bullmq has no lazy-connect option (`autorun: false` and `skipWaitingForReady` both still connect at construction, verified) — and the entrypoint is constructed eagerly during `AppBuilder…build()`, so the connection was opening *before* `lifecycle.start()`.

The `Worker` is now created inside the entrypoint's `start()` instead of its constructor, so all external I/O happens within the lifecycle (the entrypoint's `redis:bullmq:<name>` wrapper stays in the `wait` state until `start()`). `start()` also waits for the worker connection to be ready before returning — so it reports started only once it can actually process jobs, and a fast `start()`/`stop()` no longer leaks an unhandled `"Connection is closed"` rejection.
