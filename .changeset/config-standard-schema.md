---
"@basica/config": patch
"@basica/core": patch
"@basica/pg": patch
"@basica/ioredis": patch
"@basica/kafkajs": patch
"@basica/amqp-connection-manager": patch
"@basica/fastify": patch
---

Configuration now uses [Standard Schema](https://standardschema.dev) instead of TypeBox.

**Breaking:**

- `configure(provider, schema)` accepts any Standard Schema and validates through the schema's own `~standard.validate`; `@basica/config` no longer depends on `@sinclair/typebox`.
- The config schemas shipped by `@basica/core` and the plugins (`loggerConfigSchema`, `pgConfigSchema`, `fastifyConfigSchema`, etc.) are now [Zod](https://zod.dev) schemas. Install `zod` and compose them with `z.object(...)` instead of `Type.Object(...)`.
- Reading configuration from environment variables requires a schema that also exposes a [Standard JSON Schema](https://standardschema.dev/json-schema) (Zod v4 does).

**New:**

- `envProvider({ dotenv: false })` skips loading a `.env` file entirely.
- `ConfigProvider` is now generic in the schema it consumes: shaped providers (object, file, remote) work with any Standard Schema, while flat-source providers like `envProvider` require a Standard JSON Schema.
