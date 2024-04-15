import { IEntrypoint } from "@basica/core";
import { ILogger } from "@basica/core/logger";

import { Cluster, Redis } from "ioredis";

import { Wrapper } from "src/wrapper";
import { randomUUID } from "node:crypto";
import { tracer } from "src/tracer";
import { SpanStatusCode } from "@opentelemetry/api";

export type SubscribeFn<T extends Redis | Cluster> = (
  msg: string,
  reqId: string,
  channel: string,
  ioredis: T
) => Promise<void>;

export type Sub<T extends Redis | Cluster> = {
  channel: string;
  fn: SubscribeFn<T>;
};

// TODO: basic metrics?
// TODO: validation schemas on events?
export class RedisSubscriberEntrypoint<T extends Redis | Cluster>
  implements IEntrypoint
{
  #redis: Wrapper<T>;
  #logger: ILogger;

  #channelMap = new Map<string, SubscribeFn<T>>();
  #patternMap = new Map<string, SubscribeFn<T>>();

  #channels: Sub<T>[];
  #shards: Sub<T>[];
  #patterns: Sub<T>[];

  constructor(
    redis: Wrapper<T>,
    logger: ILogger,
    name: string,
    channels: Sub<T>[],
    shards: Sub<T>[],
    patterns: Sub<T>[]
  ) {
    this.#redis = redis;
    this.#logger = logger.child({ name: `@basica:entrypoint:ioredis:${name}` });

    this.#channels = channels;
    this.#shards = shards;
    this.#patterns = patterns;

    for (const channel of [...channels, ...shards]) {
      if (this.#channelMap.has(channel.channel)) {
        this.#logger.warn(
          { channel: channel.channel },
          `Duplicate channel ${channel.channel}, function will not be called`
        );
      } else {
        this.#channelMap.set(channel.channel, channel.fn);
      }
    }
    for (const channel of patterns) {
      if (this.#patternMap.has(channel.channel)) {
        this.#logger.warn(
          { channel: channel.channel },
          `Duplicate pattern ${channel.channel}, function will not be called`
        );
      } else {
        this.#patternMap.set(channel.channel, channel.fn);
      }
    }
  }

  async #handle(channel: string, msg: string, fn: SubscribeFn<T>) {
    const reqId = randomUUID();

    await tracer.startActiveSpan(
      `handle:${channel}`,
      {
        attributes: {
          "request.id": reqId,
        },
      },
      async (span) => {
        this.#logger.info(
          { channel, reqId },
          `Received message on channel ${channel}`
        );

        try {
          await fn(msg, reqId, channel, this.#redis.ioredis);
        } catch (err) {
          this.#logger.error(
            { err, channel, reqId },
            `Error handling message on channel ${channel}`
          );
          span.recordException(err as Error);
          span.setStatus({ code: SpanStatusCode.ERROR });
        }
        span.end();
      }
    );
  }

  async #subscribe(signal: AbortSignal) {
    for (const channel of this.#channels) {
      await this.#redis.ioredis.subscribe(channel.channel);
      signal.throwIfAborted();
    }

    for (const channel of this.#shards) {
      await this.#redis.ioredis.ssubscribe(channel.channel);
      signal.throwIfAborted();
    }

    for (const channel of this.#patterns) {
      await this.#redis.ioredis.psubscribe(channel.channel);
      signal.throwIfAborted();
    }
  }

  async #unsubscribe(signal: AbortSignal) {
    for (const channel of this.#channels) {
      await this.#redis.ioredis.unsubscribe(channel.channel);
      signal.throwIfAborted();
    }

    for (const channel of this.#shards) {
      await this.#redis.ioredis.sunsubscribe(channel.channel);
      signal.throwIfAborted();
    }

    for (const channel of this.#patterns) {
      await this.#redis.ioredis.punsubscribe(channel.channel);
      signal.throwIfAborted();
    }
  }

  async start(signal: AbortSignal) {
    await this.#redis.start();
    signal.throwIfAborted();

    await this.#subscribe(signal);

    this.#redis.ioredis.on("message", async (channel: string, msg: string) => {
      const fn = this.#channelMap.get(channel);
      if (!fn) throw new Error("No function for channel " + channel);

      await this.#handle(channel, msg, fn);
    });
    this.#redis.ioredis.on(
      "pmessage",
      async (pattern: string, channel: string, msg: string) => {
        const fn = this.#patternMap.get(pattern);
        if (!fn) throw new Error("No function for pattern " + pattern);

        await this.#handle(channel, msg, fn);
      }
    );
  }

  async shutdown(signal: AbortSignal) {
    await this.#unsubscribe(signal);
    await this.#redis.shutdown();
  }
}
