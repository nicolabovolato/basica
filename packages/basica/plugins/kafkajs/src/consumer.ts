import { IHealthcheck, IShutdown, IStartup } from "@basica/core";
import { Consumer as KafkaConsumer } from "kafkajs";

export const consumerWrapper = (consumer: KafkaConsumer) => {
  let healthy = false;
  consumer.on("consumer.connect", () => (healthy = true));
  consumer.on("consumer.disconnect", () => (healthy = false));
  consumer.on("consumer.crash", () => (healthy = false));

  return {
    ...consumer,
    start: async () => {
      await consumer.connect();
    },
    shutdown: async () => {
      await consumer.disconnect();
    },
    healthcheck: async () => {
      return {
        status: healthy ? "healthy" : "unhealthy",
      };
    },
  } satisfies KafkaConsumer & IShutdown & IStartup & IHealthcheck;
};

export type Consumer = ReturnType<typeof consumerWrapper>;
