---
"@basica/platform-node": patch
---

Add `@basica/platform-node` — the Node runner for a basica app.

`run(app)` starts the lifecycle, installs graceful-shutdown handlers (`SIGINT`/`SIGTERM`/`uncaughtException`/`unhandledRejection` via close-with-grace), and exits with code `1` on failure. This is the behaviour that used to live in `App.run()` in `@basica/core`; moving it into a per-platform package keeps core runtime-neutral.

```ts
import { run } from "@basica/platform-node";

run(getApp());
```
