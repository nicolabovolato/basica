import { randomUUID } from "node:crypto";

import { describe, expect, inject, test } from "vitest";

import { getAMQPClient } from "./utils";

const amqpUrl = inject("amqpUrl");

describe("AMQPClient", () => {
  test("healthcheck", async () => {
    const client = getAMQPClient(amqpUrl);
    expect(await client.healthcheck()).toEqual({
      status: "unhealthy",
      description: "Client is not connected",
    });
    await client.start();
    expect(await client.healthcheck()).toEqual({ status: "healthy" });
  });

  test("start", async () => {
    const client = getAMQPClient(amqpUrl);
    await client.start();
  });

  test("createChannel/assertQueue/sendToQueue", async () => {
    const client = getAMQPClient(amqpUrl);
    const queue = randomUUID();

    const channel = client.createChannel();
    await channel.assertQueue(queue);
    await channel.sendToQueue(queue, { test: "test" });
  });

  test("shutdown", async () => {
    const client = getAMQPClient(amqpUrl);
    await client.shutdown();
  });
});
