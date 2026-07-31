---
"@basica/core": patch
---

Rename the `App` class to `Application`, add an exported `IApplication` interface it implements, and remove `Application.run()`.

`IApplication` is the minimal built-application contract — `deps`, `healthchecks`, `services`, `entrypoints`, `lifecycle` — that lets a platform runner drive an app without depending on its concrete generic types.

Running an app now lives in a per-platform package rather than in core, so core no longer depends on `close-with-grace` or calls `process.exit`. Replace `app.run()` with a runner:

```ts
import { run } from "@basica/platform-node";

run(getApp());
```
