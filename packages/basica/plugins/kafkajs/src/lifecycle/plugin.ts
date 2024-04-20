import { AppRequiredServices, LifecycleManagerBuilder } from "@basica/core";
import { Plugin } from "@basica/core/utils";

import { Kafka } from "src/client";
import { KafkaConfig } from "src/config";
import { EntrypointConfig, KafkaConsumerEntrypoint } from "./entrypoint";

class KafkaLifecyclePlugin<S extends AppRequiredServices> {
  readonly #lifecycle: LifecycleManagerBuilder<S>;
  constructor(lifecycle: LifecycleManagerBuilder<S>) {
    this.#lifecycle = lifecycle;
  }

  /**
   * Istantiates a kafka consumer and registers it in the application lifecycle
   * @param name entrypoint name
   * @param clientOrClientConfig kafka client {@link Kafka} or config {@link KafkaConfig}
   * @param config config {@link EntrypointConfig}
   * @example
   * builder.addKafkaConsumer("consumer", services.client, {
   *   create: {
   *     groupId: "test",
   *   },
   *   subscribe: {
   *     topics: ["test"],
   *   },
   *   run: {
   *     eachMessage: async () => {
   *       //...
   *     }
   *   }
   * })
   * @example
   * builder.addKafkaConsumer("consumer",
   *   {
   *     brokers: ["localhost:9093"],
   *     timeout: 5000,
   *   },
   *   {
   *     create: {
   *       groupId: "test",
   *     },
   *     subscribe: {
   *       topics: ["test"],
   *     },
   *     run: {
   *       eachMessage: async () => {
   *         //...
   *       }
   *     }
   *   }
   * })
   */
  addKafkaConsumer(
    name: string,
    clientOrClientConfig: Kafka | KafkaConfig,
    config: EntrypointConfig
  ) {
    const client =
      clientOrClientConfig instanceof Kafka
        ? clientOrClientConfig
        : new Kafka(
            clientOrClientConfig as KafkaConfig,
            this.#lifecycle.services.logger,
            `consumer:${name}`
          );

    this.#lifecycle.addEntrypoint(
      name,
      (services) =>
        new KafkaConsumerEntrypoint(name, client, services.logger, config)
    );

    return this;
  }
}

/** Kafka lifecycle plugin */
export const lifecyclePlugin = (<S extends AppRequiredServices>(
  lifecycle: LifecycleManagerBuilder<S>
) => new KafkaLifecyclePlugin(lifecycle)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredServices>
>;
