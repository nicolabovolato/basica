import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";

import { getAMQPClient } from "./utils";

let rabbitmq: StartedTestContainer;

beforeAll(async () => {
  rabbitmq = await new GenericContainer("rabbitmq:4-alpine")
    .withExposedPorts(5672)
    // Wait on the broker's own log rather than an in-container health
    // command: log matching runs nothing inside the container, so it stays
    // reliable even when many test containers contend for CPU. This line is
    // printed after the AMQP listener is already accepting connections.
    .withWaitStrategy(Wait.forLogMessage(/Server startup complete/))
    .start();
}, 120000);

afterAll(async () => {
  await rabbitmq?.stop();
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
