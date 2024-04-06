import { setTimeout } from "node:timers/promises";

import { afterAll, beforeAll, beforeEach, expect, test, vi } from "vitest";
import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import { Redis } from "ioredis";
import { Queue } from "bullmq";

import { loggerFactory } from "@basica/core/logger";
import { RedisWrapper } from "@basica/ioredis";

import { BullMqWorkerEntrypoint } from "src/entrypoint";

const logger = loggerFactory({ level: "info" });
let redis: StartedRedisContainer;

beforeAll(async () => {
  redis = await new RedisContainer("redis:7-alpine").start();
}, 60000);

beforeEach(async () => {
  await redis.executeCliCmd("flushall");
});

afterAll(async () => {
  await redis.stop();
});

test.each(["ioredis", "wrapper"])(
  "entrypoint (%s)",
  async (redisType) => {
    let workerConnection: Redis;
    let queueConnection: Redis;
    if (redisType == "wrapper") {
      workerConnection = new RedisWrapper(
        {
          url: redis.getConnectionUrl(),
          timeout: 5000,
          maxRetriesPerRequest: null,
        },
        logger
      ).ioredis;
      queueConnection = new RedisWrapper(
        {
          url: redis.getConnectionUrl(),
          timeout: 5000,
        },
        logger
      ).ioredis;
    } else {
      workerConnection = new Redis(redis.getConnectionUrl(), {
        maxRetriesPerRequest: null,
      });
      (queueConnection = new Redis(redis.getConnectionUrl())), {};
    }

    const queueName = "queue";

    const handler = vi
      .fn()
      .mockImplementationOnce(async () => {})
      .mockImplementationOnce(async () => {
        throw new Error("aaa");
      })
      .mockImplementationOnce(async () => {});

    const entrypoint = new BullMqWorkerEntrypoint(
      logger,
      "worker",
      queueName,
      handler,
      {
        connection: workerConnection,
      }
    );

    const queue = new Queue(queueName, { connection: queueConnection });

    await entrypoint.start();

    await queue.add("test1", {});
    await queue.add(
      "test2",
      {},
      {
        attempts: 2,
      }
    );

    await setTimeout(1000);

    await entrypoint.shutdown();
    await queue.close();

    expect(handler).toBeCalledTimes(3);
    expect(handler).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: "test1" }),
      expect.anything()
    );
    expect(handler).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ name: "test2" }),
      expect.anything()
    );
    expect(handler).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ name: "test2" }),
      expect.anything()
    );
  },
  60000
);
