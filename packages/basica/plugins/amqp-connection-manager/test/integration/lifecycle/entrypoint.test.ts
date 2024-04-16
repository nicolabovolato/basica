import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { randomUUID } from "node:crypto";

import { GenericContainer, StartedTestContainer } from "testcontainers";

import { getAMQPClient } from "../utils";
import { loggerFactory } from "@basica/core/logger";
import { AMQPQueueConsumerEntrypoint } from "src/lifecycle/entrypoint";
import { Channel } from "amqplib";
import { setTimeout } from "node:timers/promises";

let rabbitmq: StartedTestContainer;
const logger = loggerFactory({ level: "silent" });

beforeAll(async () => {
  rabbitmq = await new GenericContainer("rabbitmq:3-alpine")
    .withExposedPorts(5672)
    .withHealthCheck({
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"],
      interval: 1000,
      timeout: 1000,
      retries: 10,
    })
    .start();
}, 60000);

afterAll(async () => {
  await rabbitmq.stop();
}, 10000);

test("queue", async () => {
  const handler = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("test error"))
    .mockResolvedValueOnce(undefined);

  const queueName = randomUUID();

  const client = getAMQPClient(rabbitmq);
  const publisher = client.createChannel({
    setup: async (channel: Channel) => {
      await channel.assertQueue(queueName, { durable: true });
    },
  });

  const entrypoint = new AMQPQueueConsumerEntrypoint("test", client, logger, {
    queueName,
    handler,
  });

  await client.start();
  await entrypoint.start();

  await publisher.sendToQueue(queueName, { name: "test1" });
  await publisher.sendToQueue(queueName, { name: "test2" });

  await setTimeout(1000);
  await entrypoint.shutdown();
  await client.shutdown();

  expect(handler).toHaveBeenCalledTimes(3);
  expect(JSON.parse(handler.mock.calls[0][0].content.toString())).toEqual({
    name: "test1",
  });
  expect(JSON.parse(handler.mock.calls[1][0].content.toString())).toEqual({
    name: "test2",
  });
  expect(JSON.parse(handler.mock.calls[2][0].content.toString())).toEqual({
    name: "test2",
  });
});

test("exchange", async () => {
  const handler = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("test error"))
    .mockResolvedValueOnce(undefined);

  const queueName = randomUUID();
  const exchangeName = randomUUID();

  const client = getAMQPClient(rabbitmq);
  const publisher = client.createChannel({
    setup: async (channel: Channel) => {
      await channel.assertQueue(queueName, { durable: true });
      await channel.assertExchange(exchangeName, "fanout", { durable: true });
      await channel.bindQueue(queueName, exchangeName, "");
    },
  });

  const entrypoint = new AMQPQueueConsumerEntrypoint("test", client, logger, {
    queueName,
    handler,
  });

  await client.start();
  await entrypoint.start();

  await publisher.publish(exchangeName, "", { name: "test1" });
  await publisher.publish(exchangeName, "", { name: "test2" });

  await setTimeout(1000);
  await entrypoint.shutdown();
  await client.shutdown();

  expect(handler).toHaveBeenCalledTimes(3);
  expect(JSON.parse(handler.mock.calls[0][0].content.toString())).toEqual({
    name: "test1",
  });
  expect(JSON.parse(handler.mock.calls[1][0].content.toString())).toEqual({
    name: "test2",
  });
  expect(JSON.parse(handler.mock.calls[2][0].content.toString())).toEqual({
    name: "test2",
  });
});
