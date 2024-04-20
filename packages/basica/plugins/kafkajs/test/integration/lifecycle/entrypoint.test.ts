import { loggerFactory } from "@basica/core/logger";

import { KafkaContainer, StartedKafkaContainer } from "@testcontainers/kafka";
import { setTimeout } from "node:timers/promises";

import { KafkaConsumerEntrypoint } from "src/lifecycle/entrypoint";
import { afterAll, beforeAll, expect, test, vi } from "vitest";
import { getKafkaClient } from "../utils";

let kafka: StartedKafkaContainer;

beforeAll(async () => {
  kafka = await new KafkaContainer("confluentinc/cp-kafka:7.6.1")
    .withKraft()
    .withExposedPorts(9092)
    .start();
}, 60000);

afterAll(async () => {
  await kafka.stop();
}, 10000);

const logger = loggerFactory({ level: "silent" });

test("topic", async () => {
  const handler = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("test error"))
    .mockResolvedValueOnce(undefined);

  const topic = "test";

  const client = getKafkaClient(kafka);
  const admin = client.admin();
  const publisher = client.producer();

  await admin.start();
  await admin.createTopics({ topics: [{ topic }], waitForLeaders: true });
  await admin.shutdown();

  const entrypoint = new KafkaConsumerEntrypoint("test", client, logger, {
    create: {
      groupId: "test",
    },
    subscribe: {
      topic,
    },
    run: {
      eachMessage: handler,
    },
  });

  await publisher.start();
  await entrypoint.start();
  await setTimeout(1000);

  await publisher.send({
    topic,
    messages: [
      { value: JSON.stringify({ name: "test1" }) },
      { value: JSON.stringify({ name: "test2" }) },
    ],
  });
  await setTimeout(1000);

  await publisher.shutdown();
  await entrypoint.shutdown();

  expect(handler).toHaveBeenCalledTimes(3);
  expect(JSON.parse(handler.mock.calls[0][0].message.value.toString())).toEqual(
    {
      name: "test1",
    }
  );
  expect(JSON.parse(handler.mock.calls[1][0].message.value.toString())).toEqual(
    {
      name: "test2",
    }
  );
  expect(JSON.parse(handler.mock.calls[2][0].message.value.toString())).toEqual(
    {
      name: "test2",
    }
  );
}, 15000);
