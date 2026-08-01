# @basica/platform-node

## 0.0.1

### Patch Changes

- [#34](https://github.com/nicolabovolato/basica/pull/34) [`79f53e7`](https://github.com/nicolabovolato/basica/commit/79f53e777f6fed73e0a9a3762a3b305bb4354da6) Thanks [@nicolabovolato](https://github.com/nicolabovolato)! - Add `@basica/platform-node` — the Node runner for a basica app.

  `run(app)` starts the lifecycle, installs graceful-shutdown handlers (`SIGINT`/`SIGTERM`/`uncaughtException`/`unhandledRejection` via close-with-grace), and exits with code `1` on failure. This is the behaviour that used to live in `App.run()` in `@basica/core`; moving it into a per-platform package keeps core runtime-neutral.

  ```ts
  import { run } from "@basica/platform-node";

  run(getApp());
  ```

- Updated dependencies [[`4921f0c`](https://github.com/nicolabovolato/basica/commit/4921f0c9ee737fb7dc7f03811668ededeb412d6c), [`79f53e7`](https://github.com/nicolabovolato/basica/commit/79f53e777f6fed73e0a9a3762a3b305bb4354da6), [`0d9a18c`](https://github.com/nicolabovolato/basica/commit/0d9a18cb26964b3903b6007a72e8b8c04b0872cf), [`ab3190f`](https://github.com/nicolabovolato/basica/commit/ab3190f6f2f258409e3a58cbfe6fb1f906aaf3cc), [`3007746`](https://github.com/nicolabovolato/basica/commit/3007746d430ca8689ee3f13d34dd265fdd1788d8)]:
  - @basica/core@0.0.8
