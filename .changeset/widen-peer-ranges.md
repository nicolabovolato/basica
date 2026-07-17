---
"@basica/kysely": patch
"@basica/pg": patch
"@basica/ioredis": patch
"@basica/kafkajs": patch
"@basica/amqp-connection-manager": patch
"@basica/bullmq": patch
---

Widen each third-party `peerDependency` to the widest honest range — `>=<earliest version whose API the plugin actually uses> <<next breaking major>>` — determined from the concrete API surface each plugin depends on:

- **kysely** `>=0.29.0 <0.30.0` — needs the `kysely/migration` subpath export, first added in 0.29.0 (0.x, so capped at the next minor since the plugin subclasses `Kysely`/`Migrator`)
- **pg** `>=8.0.0 <9.0.0` — needs the ES6-class `Pool`/`Client` that `extends` relies on, shipped in 8.0.0
- **ioredis** `>=5.3.0 <6.0.0` — needs sharded pub/sub (`ssubscribe`/`sunsubscribe`), added in 5.3.0
- **kafkajs** `>=2.0.0 <3.0.0` — needs the `enforceRequestTimeout` config field, added in 2.0.0
- **amqp-connection-manager** `>=4.0.0 <5.0.0` — needs the `connectFailed` event, added in 4.0.0; **amqplib** `>=0.10.0 <0.11.0` (0.x → next-minor cap; 0.10.0 is the promise-rewrite boundary)
- **bullmq** `>=5.0.0 <6.0.0` — all surface used is stable since 5.0.0

`@basica/bullmq` and `@basica/ioredis` declare the identical `ioredis` range so a consumer resolves a single ioredis copy (bullmq's `connection instanceof Redis`/`Cluster` checks depend on it).

Also removes the redundant `@basica/ioredis` entry from `@basica/bullmq`'s `dependencies` — it is already a `peerDependency`.
