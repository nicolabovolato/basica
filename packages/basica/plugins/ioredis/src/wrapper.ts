import { IHealthcheck, IShutdown, IStartup } from "@basica/core";
import { ILogger } from "@basica/core/logger";
import { Redis, Cluster } from "ioredis";

export abstract class Wrapper<T extends Redis | Cluster>
  implements IHealthcheck, IStartup, IShutdown
{
  protected readonly logger: ILogger;

  constructor(
    readonly ioredis: T,
    logger: ILogger,
    name?: string
  ) {
    this.logger = name
      ? logger.child({ name: `@basica:service:ioredis:${name}` })
      : logger;
    this.ioredis.on("error", (err) => this.logger.error(err, "ioredis error"));
  }

  async healthcheck() {
    await this.ioredis.ping();
    return {
      status: "healthy",
    } as const;
  }

  async start() {
    await this.ioredis.connect();
  }

  async shutdown() {
    await this.ioredis.quit();
  }
}
