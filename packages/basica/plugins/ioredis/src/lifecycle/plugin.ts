import { AppRequiredDeps, LifecycleManagerBuilder } from "@basica/core";
import { Plugin, RegistersEntrypoint } from "@basica/core/utils";

import { Cluster, Redis } from "ioredis";

import { ClusterWrapper } from "../cluster";
import {
  ClusterWrapperConfig,
  RedisWrapperConfig,
  isClusterWrapperConfig,
} from "../config";
import { RedisWrapper } from "../redis";
import { Wrapper } from "../wrapper";
import { RedisSubscriberEntrypointBuilder } from "./builder";
import { RedisSubscriberEntrypoint } from "./entrypoint";

class RedisLifecyclePlugin<D extends AppRequiredDeps> {
  #lifecycle: LifecycleManagerBuilder<D>;

  constructor(lifecycle: LifecycleManagerBuilder<D>) {
    this.#lifecycle = lifecycle;
  }

  /**
   * Registers redis subscriber in the application lifecycle
   * @see {@link RedisSubscriberEntrypointBuilder}
   * @param name entrypoint name
   * @param config config {@link RedisWrapperConfig} or {@link ClusterWrapperConfig}
   * @param redisWrapper redis wrapper instance
   * @param fn builder function
   * @example
   * builder.addRedisSubscriber("worker", { url: "redis://localhost:6379" }, (builder) =>
   *   builder.subscribeTo("channel1", (...) => {
   *     // ...
   *   })
   * )
   * @example
   * builder.addRedisSubscriber("worker", { nodes: [{ host: "localhost", port: 6379 }] }, (builder) =>
   *   builder.subscribeToShard("channel1", (...) => {
   *     // ...
   *   })
   * )
   * @example
   * builder.addRedisSubscriber("worker", deps.redis, (builder) =>
   *   builder.subscribeTo("channel1", (...) => {
   *     // ...
   *   })
   * )
   */
  // a redis config builds a single-instance subscriber; a cluster config builds a cluster
  // subscriber (sharded pub/sub); or bring your own wrapper and its `T` pins the type.
  addRedisSubscriber<const K extends string>(
    name: K,
    config: RedisWrapperConfig,
    fn: (
      builder: RedisSubscriberEntrypointBuilder<Redis>,
      deps: D,
    ) => RedisSubscriberEntrypointBuilder<Redis>,
  ): this & RegistersEntrypoint<K, RedisSubscriberEntrypoint<Redis>>;
  addRedisSubscriber<const K extends string>(
    name: K,
    config: ClusterWrapperConfig,
    fn: (
      builder: RedisSubscriberEntrypointBuilder<Cluster>,
      deps: D,
    ) => RedisSubscriberEntrypointBuilder<Cluster>,
  ): this & RegistersEntrypoint<K, RedisSubscriberEntrypoint<Cluster>>;
  addRedisSubscriber<const K extends string, T extends Redis | Cluster>(
    name: K,
    redisWrapper: Wrapper<T>,
    fn: (
      builder: RedisSubscriberEntrypointBuilder<T>,
      deps: D,
    ) => RedisSubscriberEntrypointBuilder<T>,
  ): this & RegistersEntrypoint<K, RedisSubscriberEntrypoint<T>>;
  addRedisSubscriber<T extends Redis | Cluster>(
    name: string,
    redisWrapperOrConfig:
      | Wrapper<T>
      | RedisWrapperConfig
      | ClusterWrapperConfig,
    fn: (
      builder: RedisSubscriberEntrypointBuilder<T>,
      deps: D,
    ) => RedisSubscriberEntrypointBuilder<T>,
  ) {
    const redisWrapper =
      redisWrapperOrConfig instanceof Wrapper
        ? redisWrapperOrConfig
        : ((isClusterWrapperConfig(redisWrapperOrConfig)
            ? new ClusterWrapper(
                redisWrapperOrConfig,
                this.#lifecycle.deps.logger,
                name,
              )
            : new RedisWrapper(
                redisWrapperOrConfig,
                this.#lifecycle.deps.logger,
                name,
              )) as Wrapper<T>);

    const builder = new RedisSubscriberEntrypointBuilder(
      redisWrapper,
      this.#lifecycle.deps.logger,
      name,
    );
    const entrypoint = fn(builder, this.#lifecycle.deps).build();

    this.#lifecycle.addEntrypoint(name, () => entrypoint);
    return this as this &
      RegistersEntrypoint<string, RedisSubscriberEntrypoint<T>>;
  }
}

/** Redis lifecycle plugin */
export const lifecyclePlugin = (<S extends AppRequiredDeps>(
  base: LifecycleManagerBuilder<S>,
) => new RedisLifecyclePlugin(base)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredDeps>
>;
