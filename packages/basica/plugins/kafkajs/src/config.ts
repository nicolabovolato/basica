import { Static, Type } from "@sinclair/typebox";
import { KafkaConfig as KafkaClientConfig } from "kafkajs";

export const kafkaConfigSchema = Type.Intersect([
  Type.Object({
    brokers: Type.Union([Type.String(), Type.Array(Type.String())]),
  }),
  Type.Union([
    Type.Object({
      connectionTimeout: Type.Number(),
      authenticationTimeout: Type.Number(),
      requestTimeout: Type.Number(),
      // retry: Type.Object({
      //   maxRetryTime: Type.Number(),
      // }),
    }),
    Type.Object({
      timeout: Type.Number(),
    }),
  ]),
]);

export type KafkaConfig = KafkaClientConfig & Static<typeof kafkaConfigSchema>;

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
