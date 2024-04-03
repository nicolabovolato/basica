import { ILogger } from "@basica/core/logger";
import { Redis } from "ioredis";

import { Wrapper } from "./wrapper";
import { RedisWrapperConfig, getRedisConfig } from "./config";

/** Redis wrapper */
export class RedisWrapper extends Wrapper<Redis> {
  /**
   * @param options redis {@link RedisWrapperConfig config}
   * @param options redis cluster {@link ClusterWrapperConfig config}
   * @param logger {@link ILogger}
   * @example
   * const wrapper = new RedisWrapper(
   *  { url: "redis://127.0.0.1:6379", timeout: 5000 },
   *  logger
   * )
   * @example
   * const wrapper = new RedisWrapper(
   *  { url: "redis://127.0.0.1:6379", timeout: 5000 },
   *  logger,
   *  "cache"
   * )
   */
  constructor(options: RedisWrapperConfig, logger: ILogger);
  constructor(options: RedisWrapperConfig, logger: ILogger, name: string);
  constructor(options: RedisWrapperConfig, logger: ILogger, name?: string) {
    const { url, config } = getRedisConfig(options);

    const ioredis = url ? new Redis(url, config) : new Redis(config);
    super(ioredis, logger, name);
  }
}
