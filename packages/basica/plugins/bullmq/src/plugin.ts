import { AppRequiredServices, LifecycleManagerBuilder } from "@basica/core";
import { Plugin } from "@basica/core/utils";
import { ClusterWrapper, RedisWrapper } from "@basica/ioredis";

import { Processor } from "bullmq";
import { Cluster, Redis } from "ioredis";

import { WorkerConfig, isClusterWrapperConfig } from "./config";
import { BullMqWorkerEntrypoint } from "./entrypoint";

class BullMqLifecyclePlugin<S extends AppRequiredServices> {
  readonly #lifecycle: LifecycleManagerBuilder<S>;
  constructor(lifecycle: LifecycleManagerBuilder<S>) {
    this.#lifecycle = lifecycle;
  }

  /**
   * Registers bullmq worker instance in the application lifecycle
   * If no redis instance is provided in config.connection, an ioredis service will be registered in the application lifecycle
   * @param name entrypoint name
   * @param queueName queue name, defaults to name parameter
   * @param config config {@link WorkerConfig}
   * @param fn handler function
   * @example
   * builder.addBullMqWorker("worker", { connection: { url: "redis://localhost:6379", timeout: 1000 } }, async (job) => {
   *   // ...
   * })
   * @example
   * builder.addBullMqWorker("worker", "queue", { connection: { url: "redis://localhost:6379", timeout: 1000 } }, async (job) => {
   *   // ...
   * })
   * @example
   * builder.addBullMqWorker("worker", { connection: ioredis }, async (job) => {
   *   // ...
   * })
   * @example
   * builder.addBullMqWorker("worker", "queue", { connection: ioredis }, async (job) => {
   *   // ...
   * })
   */
  addBullMqWorker<T, R>(
    name: string,
    config: WorkerConfig,
    fn: Processor<T, R>
  ): this;
  addBullMqWorker<T, R>(
    name: string,
    queueName: string,
    config: WorkerConfig,
    fn: Processor<T, R>
  ): this;
  addBullMqWorker<T, R>(
    name: string,
    queueNameOrConfig: string | WorkerConfig,
    configOrFn: WorkerConfig | Processor<T, R>,
    maybeFn?: Processor<T, R>
  ) {
    const queueName =
      typeof queueNameOrConfig === "string" ? queueNameOrConfig : name;
    const config =
      typeof queueNameOrConfig === "string"
        ? (configOrFn as WorkerConfig)
        : queueNameOrConfig;
    const fn =
      typeof queueNameOrConfig === "string"
        ? maybeFn!
        : (configOrFn as Processor<T, R>);

    let connection = config.connection;
    if (!(connection instanceof Redis) && !(connection instanceof Cluster)) {
      const wrapper = isClusterWrapperConfig(connection)
        ? new ClusterWrapper(
            connection,
            this.#lifecycle.services.logger,
            `bullmq:${name}`
          )
        : new RedisWrapper(
            connection,
            this.#lifecycle.services.logger,
            `bullmq:${name}`
          );
      connection = wrapper.ioredis;
      this.#lifecycle.addService(`redis:bullmq:${name}`, () => wrapper);
    }

    this.#lifecycle.addEntrypoint(
      name,
      (services) =>
        new BullMqWorkerEntrypoint(services.logger, name, queueName, fn, {
          ...config,
          connection,
        })
    );
    return this;
  }
}

/** BullMQ lifecycle plugin */
export const lifecyclePlugin = (<S extends AppRequiredServices>(
  lifecycle: LifecycleManagerBuilder<S>
) => new BullMqLifecyclePlugin(lifecycle)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredServices>
>;
