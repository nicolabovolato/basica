import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { GenericContainer, StartedTestContainer } from "testcontainers";

import { getAMQPClient } from "./utils";

let rabbitmq: StartedTestContainer;

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

describe("AMQPClient", () => {
  test("healthcheck", async () => {
    const client = getAMQPClient(rabbitmq);
    expect(await client.healthcheck()).toEqual({
      status: "unhealthy",
      description: "Client is not connected",
    });
    await client.start();
    expect(await client.healthcheck()).toEqual({ status: "healthy" });
  });

  test("start", async () => {
    const client = getAMQPClient(rabbitmq);
    await client.start();
  });

  test("createChannel/assertQueue/sendToQueue", async () => {
    const client = getAMQPClient(rabbitmq);
    const queue = randomUUID();

    const channel = client.createChannel();
    await channel.assertQueue(queue);
    await channel.sendToQueue(queue, { test: "test" });
  });

  test("shutdown", async () => {
    const client = getAMQPClient(rabbitmq);
    await client.shutdown();
  });
});
