import { ILogger } from "@basica/core/logger";

import {
  AdminConfig,
  ConsumerConfig,
  Kafka as KafkaClient,
  ProducerConfig,
  logCreator,
  logLevel,
} from "kafkajs";

import { adminWrapper } from "./admin";
import { KafkaConfig, getKafkaConfig } from "./config";
import { consumerWrapper } from "./consumer";
import { producerWrapper } from "./producer";

const getKafkaLoggerFn =
  (logger: ILogger): logCreator =>
  () =>
  ({ level, log }) => {
    const { message, timestamp: _, ...extra } = log;
    switch (level) {
      case logLevel.NOTHING:
        return logger.silent(extra, message);
      case logLevel.ERROR:
        return logger.error(extra, message);
      case logLevel.WARN:
        return logger.warn(extra, message);
      case logLevel.INFO:
        return logger.info(extra, message);
      case logLevel.DEBUG:
        return logger.debug(extra, message);
    }
  };

/** Kafka Client */
export class Kafka extends KafkaClient {
  // eslint-disable-next-line no-unused-private-class-members
  #logger: ILogger;
  // eslint-disable-next-line no-unused-private-class-members
  #healthy = false;

  constructor(config: KafkaConfig, logger: ILogger, name?: string) {
    super({
      ...getKafkaConfig(config),
      logCreator: getKafkaLoggerFn(
        name
          ? logger.child({
              name: `@basica:service:kafka:client:${name}:kafkajs`,
            })
          : logger.child({
              name: `@basica:service:kafka:kafkajs`,
            }),
      ),
    });

    this.#logger = name
      ? logger.child({
          name: `@basica:service:kafka:client:${name}`,
        })
      : logger;
  }

  /** @see {@link KafkaClient.admin} */
  admin(config?: AdminConfig) {
    return adminWrapper(super.admin(config));
  }

  /** @see {@link KafkaClient.producer} */
  producer(config?: ProducerConfig) {
    return producerWrapper(super.producer(config));
  }

  /** @see {@link KafkaClient.consumer} */
  consumer(config: ConsumerConfig) {
    return consumerWrapper(super.consumer(config));
  }
}
