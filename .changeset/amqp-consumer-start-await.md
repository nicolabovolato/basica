---
"@basica/amqp-connection-manager": patch
---

Fix `AMQPQueueConsumerEntrypoint.start()` not awaiting its channel setup. The `assertQueue` call inside the channel setup callback was not awaited, and `start()` returned before the channel was actually established. It now awaits the queue assertion and the channel connect (`waitForConnect()`), so `start()` means "channel established and consuming" — and a fast `start()`/`stop()` through the app lifecycle no longer races the setup and leaves a pending reply that rejects with `"Channel ended, no reply will be forthcoming"` on shutdown.
