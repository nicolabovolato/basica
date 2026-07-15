import { loggerFactory } from "@basica/core/logger";

import { logLevel } from "kafkajs";

import { Kafka } from "src/client";

export const getKafkaClient = (broker: string) => {
  return new Kafka(
    {
      brokers: [broker],
      timeout: 5000,
      logLevel: logLevel.DEBUG,
    },
    loggerFactory({ level: "silent" }),
    "test",
  );
};
