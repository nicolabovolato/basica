# @basica/platform-deno

## 0.0.1

### Patch Changes

- [#35](https://github.com/nicolabovolato/basica/pull/35) [`81c963c`](https://github.com/nicolabovolato/basica/commit/81c963cf8111f50bc96814c0d1ca684b03d2ba6b) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Add `@basica/platform-deno` — the Deno runner for a basica app.

  `run(app)` starts the lifecycle and shuts it down on `SIGINT`/`SIGTERM` (via `Deno.addSignalListener`) or an unhandled rejection, exiting `0` on a clean shutdown and `1` on failure, with a hard-kill timeout guarding a hanging shutdown. It uses Deno's native signal handling rather than close-with-grace, whose `process.on(signal)` path isn't delivered through Deno's Node compatibility layer — which is why Deno gets its own runner instead of reusing `@basica/platform-node`.

  ```ts
  import { run } from "@basica/platform-deno";

  run(getApp());
  ```

- Updated dependencies [[`4921f0c`](https://github.com/nicolabovolato/basica/commit/4921f0c9ee737fb7dc7f03811668ededeb412d6c), [`79f53e7`](https://github.com/nicolabovolato/basica/commit/79f53e777f6fed73e0a9a3762a3b305bb4354da6), [`0d9a18c`](https://github.com/nicolabovolato/basica/commit/0d9a18cb26964b3903b6007a72e8b8c04b0872cf), [`ab3190f`](https://github.com/nicolabovolato/basica/commit/ab3190f6f2f258409e3a58cbfe6fb1f906aaf3cc), [`3007746`](https://github.com/nicolabovolato/basica/commit/3007746d430ca8689ee3f13d34dd265fdd1788d8)]:
  - @basica/core@0.0.8
