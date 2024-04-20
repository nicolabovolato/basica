import { IHealthcheck, IShutdown, IStartup } from "@basica/core";
import { Producer } from "kafkajs";

export const producerWrapper = (producer: Producer) => {
  let healthy = false;
  producer.on("producer.connect", () => (healthy = true));
  producer.on("producer.disconnect", () => (healthy = false));

  return {
    ...producer,
    start: async () => {
      await producer.connect();
    },
    shutdown: async () => {
      await producer.disconnect();
    },
    healthcheck: async () => {
      return {
        status: healthy ? "healthy" : "unhealthy",
      };
    },
  } satisfies Producer & IShutdown & IStartup & IHealthcheck;
};
