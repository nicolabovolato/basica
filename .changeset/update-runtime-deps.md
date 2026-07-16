---
"@basica/config": patch
"@basica/core": patch
"@basica/fastify": patch
---

Update runtime dependencies:

- `@basica/config`: dotenv 17. `envProvider` now defaults dotenv to `{ quiet: true }` (user-overridable), so dotenv v17's startup summary line isn't printed.
- `@basica/core`: pino 10, close-with-grace 2.
- `@basica/fastify`: @fastify/swagger 9.8.
