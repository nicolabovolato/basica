---
"@basica/fastify": patch
---

`fastify` and `@basica/core` are now `peerDependencies` instead of `dependencies`, bringing `@basica/fastify` in line with the other adapter plugins (which already peer their target library + `@basica/core`). Consumers must now install `fastify` and `@basica/core` themselves — the `crud` example already does.

The fastify peer range is `>=5.6.0 <6.0.0`: the plugin configures the server with `routerOptions` (the FSTDEP022 replacement for the top-level `ignoreTrailingSlash`), which was only added to fastify's server options type in 5.6.0.

`@fastify/swagger` and `@fastify/swagger-ui` intentionally stay `dependencies` — they're the plugin's internal `useOpenapi()` implementation, imported unconditionally and never touched by the consumer.
