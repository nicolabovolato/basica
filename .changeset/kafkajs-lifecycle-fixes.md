---
"@basica/kafkajs": patch
---

Fix several bugs that only surface when a kafka consumer runs through a real app lifecycle (`app.lifecycle.start()`/`stop()`):

- The kafkajs→pino `logCreator` returned a **detached** pino method reference and called it standalone, so as soon as the logger actually emitted (any non-silent logger) it lost pino's `this` and threw `Cannot read properties of undefined (reading 'Symbol(pino.msgPrefix)')`. It now calls the pino log method directly (method invocation keeps `this`).
- `KafkaConsumerEntrypoint.shutdown()` called the raw kafkajs `stop()` (halt consuming without disconnecting) instead of `disconnect()`, so the consumer never left the group and lifecycle shutdown timed out. It now disconnects.
- `start()` now waits for the consumer to join the group before returning, so it reports started only once assigned and fetching — and a fast start/stop no longer races the join.

Note: a kafka consumer's graceful disconnect takes several seconds (leave group + finish the in-flight fetch long-poll), so apps with a kafka consumer should raise `shutdownTimeoutMs` above the 5s default.
