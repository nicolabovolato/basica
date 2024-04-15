import { IEntrypoint } from "@basica/core";
import { ILogger } from "@basica/core/logger";
import { SpanStatusCode } from "@opentelemetry/api";

import {
  AmqpConnectionManager,
  ChannelWrapper,
  CreateChannelOpts,
} from "amqp-connection-manager";
import { Channel, ConsumeMessage, Options } from "amqplib";

import { AMQPClient } from "src/client";
import { tracer } from "src/tracer";

export type Handler = (
  msg: ConsumeMessage,
  channel: ChannelWrapper
) => Promise<void>;

export type EntrypointConfig = {
  queueName: string;
  handler: Handler;
  consume?: Options.Consume;
  assertQueue?: Options.AssertQueue;
  channel?: CreateChannelOpts;
};

// TODO: metrics
export class AMQPQueueConsumerEntrypoint implements IEntrypoint {
  #logger: ILogger;
  #config: EntrypointConfig;
  #channel: ChannelWrapper;

  constructor(
    name: string,
    client: AmqpConnectionManager | AMQPClient,
    logger: ILogger,
    config: EntrypointConfig
  ) {
    this.#config = config;
    this.#logger = logger.child({
      name: `@basica:entrypoint:amqp:${name}`,
    });

    this.#channel = client.createChannel(this.#config.channel);
  }

  async #handle(msg: ConsumeMessage) {
    const msgId = msg.properties.messageId; // TODO: maybe null?
    const queue = this.#config.queueName;

    await tracer.startActiveSpan(
      `handle:${queue}`,
      {
        attributes: {
          "message.id": msgId,
        },
      },
      async (span) => {
        this.#logger.info(
          { queue, msgId },
          `Received message on queue ${queue}`
        );

        try {
          await this.#config.handler(msg, this.#channel);
          if (!this.#config.consume?.noAck) this.#channel.ack(msg);
        } catch (err) {
          this.#logger.error(
            { err, queue, msgId },
            `Error handling message on queue ${queue}`
          );
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });

          if (!this.#config.consume?.noAck) this.#channel.nack(msg);
        }

        span.end();
      }
    );
  }

  async start() {
    await this.#channel.addSetup(async (channel: Channel) => {
      channel.assertQueue(this.#config.queueName, {
        durable: true,
        ...this.#config.assertQueue,
      });
    });

    await this.#channel.consume(
      this.#config.queueName,
      (msg) => this.#handle(msg),
      this.#config.consume
    );
  }

  async shutdown() {
    await this.#channel.close();
  }
}
