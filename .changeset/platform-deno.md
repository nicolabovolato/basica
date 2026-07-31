---
"@basica/platform-deno": patch
---

Add `@basica/platform-deno` — the Deno runner for a basica app.

`run(app)` starts the lifecycle and shuts it down on `SIGINT`/`SIGTERM` (via `Deno.addSignalListener`) or an unhandled rejection, exiting `0` on a clean shutdown and `1` on failure, with a hard-kill timeout guarding a hanging shutdown. It uses Deno's native signal handling rather than close-with-grace, whose `process.on(signal)` path isn't delivered through Deno's Node compatibility layer — which is why Deno gets its own runner instead of reusing `@basica/platform-node`.

```ts
import { run } from "@basica/platform-deno";

run(getApp());
```
