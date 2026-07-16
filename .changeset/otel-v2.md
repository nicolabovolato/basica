---
"@basica/telemetry": patch
"@basica/core": patch
"@basica/kafkajs": patch
"@basica/amqp-connection-manager": patch
"@basica/ioredis": patch
"@basica/bullmq": patch
---

Migrate to OpenTelemetry v2. `@basica/telemetry`'s `TelemetryBuilder` now uses the v2 resource API (`resourceFromAttributes`) and `@opentelemetry/api` is bumped to 1.9.
