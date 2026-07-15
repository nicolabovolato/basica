import { KafkaConfig as KafkaClientConfig } from "kafkajs";
import { z } from "zod";

export const kafkaConfigSchema = z.intersection(
  z.object({
    brokers: z.union([z.string(), z.array(z.string())]),
  }),
  z.union([
    z.object({
      connectionTimeout: z.number(),
      authenticationTimeout: z.number(),
      requestTimeout: z.number(),
      // retry: z.object({
      //   maxRetryTime: z.number(),
      // }),
    }),
    z.object({
      timeout: z.number(),
    }),
  ])
);

export type KafkaConfig = KafkaClientConfig & z.infer<typeof kafkaConfigSchema>;

export const getKafkaConfig = (config: KafkaConfig) => {
  const { timeout, ...cfg } = config as KafkaConfig & {
    timeout?: number;
  };

  return {
    connectionTimeout: timeout,
    authenticationTimeout: timeout,
    requestTimeout: timeout,
    enforceRequestTimeout: true,
    // retry: {
    //   maxRetryTime: timeout,

    // },
    // retry: {
    //   retries: 0,
    // },
    ...cfg,
  } satisfies KafkaClientConfig;
};
