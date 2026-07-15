---
"@basica/amqp-connection-manager": patch
---

Bump `amqplib` to `^0.10.8` so the default `frameMax` (131072) satisfies RabbitMQ 4's minimum, fixing connection failures against RabbitMQ 4.
