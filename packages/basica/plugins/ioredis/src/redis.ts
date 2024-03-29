import { ILogger } from "@basica/core/logger";
import { Redis } from "ioredis";

import { Wrapper } from "./wrapper";
import { RedisWrapperConfig, getRedisConfig } from "./config";

export class RedisWrapper extends Wrapper<Redis> {
  constructor(options: RedisWrapperConfig, logger: ILogger);
  constructor(options: RedisWrapperConfig, logger: ILogger, name: string);
  constructor(options: RedisWrapperConfig, logger: ILogger, name?: string) {
    const { url, config } = getRedisConfig(options);

    const ioredis = url ? new Redis(url, config) : new Redis(config);
    super(ioredis, logger, name);
  }
}
