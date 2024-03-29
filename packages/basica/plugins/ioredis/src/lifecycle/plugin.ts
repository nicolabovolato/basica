import { AppRequiredServices, LifecycleManagerBuilder } from "@basica/core";
import { Plugin } from "@basica/core/utils";

import { Cluster, Redis } from "ioredis";

import { RedisWrapperConfig } from "../config";
import { Wrapper } from "../wrapper";
import { RedisSubscriberEntrypointBuilder } from "./builder";
import { RedisWrapper } from "../redis";

class RedisLifecyclePlugin<S extends AppRequiredServices> {
  #lifecycle: LifecycleManagerBuilder<S>;

  constructor(lifecycle: LifecycleManagerBuilder<S>) {
    this.#lifecycle = lifecycle;
  }

  addRedisSubscriber<T extends Redis | Cluster>(
    name: string,
    config: RedisWrapperConfig,
    fn: (
      builder: RedisSubscriberEntrypointBuilder<T>,
      services: S
    ) => RedisSubscriberEntrypointBuilder<T>
  ): this;
  addRedisSubscriber<T extends Redis | Cluster>(
    name: string,
    redisWrapper: Wrapper<T>,
    fn: (
      builder: RedisSubscriberEntrypointBuilder<T>,
      services: S
    ) => RedisSubscriberEntrypointBuilder<T>
  ): this;
  addRedisSubscriber<T extends Redis | Cluster>(
    name: string,
    redisWrapperOrConfig: Wrapper<T> | RedisWrapperConfig,
    fn: (
      builder: RedisSubscriberEntrypointBuilder<T>,
      services: S
    ) => RedisSubscriberEntrypointBuilder<T>
  ) {
    const redisWrapper =
      redisWrapperOrConfig instanceof Wrapper
        ? redisWrapperOrConfig
        : (new RedisWrapper(
            redisWrapperOrConfig,
            this.#lifecycle.services.logger,
            name
          ) as Wrapper<T>);

    const builder = new RedisSubscriberEntrypointBuilder(
      redisWrapper,
      this.#lifecycle.services.logger,
      name
    );
    const entrypoint = fn(builder, this.#lifecycle.services).build();

    this.#lifecycle.addEntrypoint(name, () => entrypoint);
    return this;
  }
}

export const lifecyclePlugin = (<S extends AppRequiredServices>(
  base: LifecycleManagerBuilder<S>
) => new RedisLifecyclePlugin(base)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredServices>
>;
