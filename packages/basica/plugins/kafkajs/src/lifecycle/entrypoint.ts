import { IEntrypoint } from "@basica/core";
import { ILogger } from "@basica/core/logger";
import { SpanStatusCode } from "@opentelemetry/api";

import {
  Consumer,
  ConsumerConfig,
  ConsumerRunConfig,
  ConsumerSubscribeTopic,
  ConsumerSubscribeTopics,
  EachBatchPayload,
  EachMessagePayload,
  Kafka,
} from "kafkajs";

import { tracer } from "src/tracer";

export type EntrypointConfig = {
  create: ConsumerConfig;
  subscribe: ConsumerSubscribeTopics | ConsumerSubscribeTopic;
  run: ConsumerRunConfig;
};

// TODO: metrics
export class KafkaConsumerEntrypoint implements IEntrypoint {
  #logger: ILogger;
  #config: EntrypointConfig;
  #consumer: Consumer;

  constructor(
    name: string,
    client: Kafka,
    logger: ILogger,
    config: EntrypointConfig
  ) {
    this.#config = config;
    this.#logger = logger.child({
      name: `@basica:entrypoint:kafka:consumer:${name}`,
    });

    this.#consumer = client.consumer(this.#config.create);
  }

  async #handleEachBatch(payload: EachBatchPayload) {
    const topic = payload.batch.topic;
    const partition = payload.batch.partition;
    const firstOffset = payload.batch.firstOffset() ?? undefined;

    await tracer.startActiveSpan(
      `handle:batch:${topic}`,
      {
        attributes: {
          topic,
          partition,
          firstOffset,
        },
      },
      async (span) => {
        this.#logger.info(
          { topic, partition, firstOffset },
          `Received batch on topic ${topic}`
        );

        try {
          await this.#config.run.eachBatch!(payload);
        } catch (err) {
          this.#logger.error(
            { err, topic, partition, firstOffset },
            `Error handling message on topic ${topic}`
          );
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
          throw err;
        } finally {
          span.end();
        }
      }
    );
  }

  async #handleEachMessage(payload: EachMessagePayload) {
    const topic = payload.topic;
    const partition = payload.partition;
    const offset = payload.message.offset;

    await tracer.startActiveSpan(
      `handle:${topic}`,
      {
        attributes: {
          topic,
          partition,
          offset,
        },
      },
      async (span) => {
        this.#logger.info(
          { topic, partition, offset },
          `Received message on topic ${topic}`
        );

        try {
          await this.#config.run.eachMessage!(payload);
        } catch (err) {
          this.#logger.error(
            { err, topic, partition, offset },
            `Error handling message on topic ${topic}`
          );
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });

          throw err;
        } finally {
          span.end();
        }
      }
    );
  }

  async start() {
    await this.#consumer.connect();

    await this.#consumer.subscribe(this.#config.subscribe);
    await this.#consumer.run({
      ...this.#config.run,
      eachMessage: this.#config.run.eachMessage
        ? (x) => this.#handleEachMessage(x)
        : undefined,
      eachBatch: this.#config.run.eachBatch
        ? (x) => this.#handleEachBatch(x)
        : undefined,
    });
  }

  async shutdown() {
    await this.#consumer.disconnect();
  }
}
