import { loggerFactory } from "@basica/core/logger";

import { StartedKafkaContainer } from "@testcontainers/kafka";
import { logLevel } from "kafkajs";

import { Kafka } from "src/client";

export const getKafkaClient = (container: StartedKafkaContainer) => {
  return new Kafka(
    {
      brokers: [`${container.getHost()}:${container.getMappedPort(9093)}`],
      timeout: 5000,
      logLevel: logLevel.DEBUG,
    },
    loggerFactory({ level: "silent" }),
    "test"
  );
};
