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

const kafkaLoggerToPinoLogFn = (logger: ILogger, level: logLevel) => {
  switch (level) {
    case logLevel.NOTHING:
      return logger.silent;
    case logLevel.ERROR:
      return logger.error;
    case logLevel.WARN:
      return logger.warn;
    case logLevel.INFO:
      return logger.info;
    case logLevel.DEBUG:
      return logger.debug;
  }
};

const getKafkaLoggerFn =
  (logger: ILogger): logCreator =>
  (_level: logLevel) => {
    return ({ namespace, level, label, log }) => {
      const { message, timestamp, ...extra } = log;
      const fn = kafkaLoggerToPinoLogFn(logger, level);
      fn(extra, message);
    };
  };

/** Kafka Client */
export class Kafka extends KafkaClient {
  #logger: ILogger;
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
            })
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
