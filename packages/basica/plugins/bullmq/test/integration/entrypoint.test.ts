import { setTimeout } from "node:timers/promises";

import { Queue, Worker } from "bullmq";
import { Redis } from "ioredis";
import { beforeEach, expect, inject, test, vi } from "vitest";

import { loggerFactory } from "@basica/core/logger";
import { RedisWrapper } from "@basica/ioredis";

import { BullMqWorkerEntrypoint } from "src/lifecycle/entrypoint";

const logger = loggerFactory({ level: "silent" });
const redisUrl = inject("redisUrl");

beforeEach(async () => {
  const redis = new Redis(redisUrl);
  await redis.flushall();
  await redis.quit();
});

test.each(["ioredis", "wrapper"])(
  "entrypoint (%s)",
  async (redisType) => {
    let workerConnection: Redis;
    let queueConnection: Redis;
    if (redisType == "wrapper") {
      workerConnection = new RedisWrapper(
        {
          url: redisUrl,
          timeout: 5000,
          maxRetriesPerRequest: null,
        },
        logger,
      ).ioredis;
      queueConnection = new RedisWrapper(
        {
          url: redisUrl,
          timeout: 5000,
        },
        logger,
      ).ioredis;
    } else {
      workerConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
      });
      queueConnection = new Redis(redisUrl);
      workerConnection.on("error", () => {});
      queueConnection.on("error", () => {});
    }

    const queueName = "queue";

    const handler = vi
      .fn()
      .mockImplementationOnce(async () => {})
      .mockImplementationOnce(async () => {
        throw new Error("error handling job");
      })
      .mockImplementationOnce(async () => {});

    const entrypoint = new BullMqWorkerEntrypoint(
      logger,
      "worker",
      queueName,
      handler,
      {
        connection: workerConnection,
      },
    );

    const queue = new Queue(queueName, { connection: queueConnection });

    await entrypoint.start();

    await queue.add("test1", {});
    await queue.add(
      "test2",
      {},
      {
        attempts: 2,
      },
    );

    await setTimeout(1000);

    await entrypoint.shutdown();
    await queue.close();

    expect(handler).toBeCalledTimes(3);
    expect(handler).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ name: "test1" }),
      expect.any(String),
      expect.any(Worker),
    );
    expect(handler).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ name: "test2" }),
      expect.any(String),
      expect.any(Worker),
    );
    expect(handler).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ name: "test2" }),
      expect.any(String),
      expect.any(Worker),
    );
  },
  60000,
);
