import { AppRequiredDeps, LifecycleManagerBuilder } from "@basica/core";
import { Plugin } from "@basica/core/utils";

import { Cluster, Redis } from "ioredis";

import { RedisWrapperConfig } from "../config";
import { RedisWrapper } from "../redis";
import { Wrapper } from "../wrapper";
import { RedisSubscriberEntrypointBuilder } from "./builder";

class RedisLifecyclePlugin<D extends AppRequiredDeps> {
  #lifecycle: LifecycleManagerBuilder<D>;

  constructor(lifecycle: LifecycleManagerBuilder<D>) {
    this.#lifecycle = lifecycle;
  }

  /**
   * Registers redis subscriber in the application lifecycle
   * @see {@link RedisSubscriberEntrypointBuilder}
   * @param name entrypoint name
   * @param config config {@link RedisWrapperConfig}
   * @param redisWrapper redis wrapper instance
   * @param fn builder function
   * @example
   * builder.addRedisSubscriber("worker", {url: "redis://localhost:6379" }, (builder) =>
   *   builder.subscribeTo("channel1", (...) => {
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
  addRedisSubscriber<T extends Redis | Cluster>(
    name: string,
    config: RedisWrapperConfig,
    fn: (
      builder: RedisSubscriberEntrypointBuilder<T>,
      deps: D
    ) => RedisSubscriberEntrypointBuilder<T>
  ): this;
  addRedisSubscriber<T extends Redis | Cluster>(
    name: string,
    redisWrapper: Wrapper<T>,
    fn: (
      builder: RedisSubscriberEntrypointBuilder<T>,
      deps: D
    ) => RedisSubscriberEntrypointBuilder<T>
  ): this;
  addRedisSubscriber<T extends Redis | Cluster>(
    name: string,
    redisWrapperOrConfig: Wrapper<T> | RedisWrapperConfig,
    fn: (
      builder: RedisSubscriberEntrypointBuilder<T>,
      deps: D
    ) => RedisSubscriberEntrypointBuilder<T>
  ) {
    const redisWrapper =
      redisWrapperOrConfig instanceof Wrapper
        ? redisWrapperOrConfig
        : (new RedisWrapper(
            redisWrapperOrConfig,
            this.#lifecycle.deps.logger,
            name
          ) as Wrapper<T>);

    const builder = new RedisSubscriberEntrypointBuilder(
      redisWrapper,
      this.#lifecycle.deps.logger,
      name
    );
    const entrypoint = fn(builder, this.#lifecycle.deps).build();

    this.#lifecycle.addEntrypoint(name, () => entrypoint);
    return this;
  }
}

/** Redis lifecycle plugin */
export const lifecyclePlugin = (<S extends AppRequiredDeps>(
  base: LifecycleManagerBuilder<S>
) => new RedisLifecyclePlugin(base)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredDeps>
>;
