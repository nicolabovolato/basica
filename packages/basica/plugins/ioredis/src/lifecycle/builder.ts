import { ILogger } from "@basica/core/logger";

import { Cluster, Redis } from "ioredis";

import { RedisSubscriberEntrypoint, Sub, SubscribeFn } from "./entrypoint";
import { Wrapper } from "src/wrapper";

export class RedisSubscriberEntrypointBuilder<T extends Redis | Cluster> {
  #redis: Wrapper<T>;
  #logger: ILogger;
  #name: string;

  #channels: Sub<T>[] = [];
  #shards: Sub<T>[] = [];
  #patterns: Sub<T>[] = [];

  constructor(redis: Wrapper<T>, logger: ILogger, name: string) {
    this.#redis = redis;
    this.#logger = logger;
    this.#name = name;
  }

  subscribeTo(channel: string, fn: SubscribeFn<T>) {
    this.#channels.push({ channel, fn });

    return this;
  }
  subscribeToShard(shard: string, fn: SubscribeFn<T>) {
    this.#shards.push({ channel: shard, fn });

    return this;
  }

  subscribeToPattern(pattern: string, fn: SubscribeFn<T>) {
    this.#patterns.push({ channel: pattern, fn });

    return this;
  }

  build() {
    return new RedisSubscriberEntrypoint(
      this.#redis,
      this.#logger,
      this.#name,
      this.#channels,
      this.#shards,
      this.#patterns
    );
  }
}
