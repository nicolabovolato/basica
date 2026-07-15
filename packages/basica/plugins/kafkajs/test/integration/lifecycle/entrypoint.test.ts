import { loggerFactory } from "@basica/core/logger";

import { setTimeout } from "node:timers/promises";

import { KafkaConsumerEntrypoint } from "src/lifecycle/entrypoint";
import { expect, inject, test, vi } from "vitest";
import { getKafkaClient } from "../utils";

const broker = inject("kafkaBroker");
const logger = loggerFactory({ level: "silent" });

test("topic", async () => {
  const handler = vi
    .fn()
    .mockResolvedValueOnce(undefined)
    .mockRejectedValueOnce(new Error("test error"))
    .mockResolvedValueOnce(undefined);

  const topic = "test";

  const client = getKafkaClient(broker);
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
    },
  );
  expect(JSON.parse(handler.mock.calls[1][0].message.value.toString())).toEqual(
    {
      name: "test2",
    },
  );
  expect(JSON.parse(handler.mock.calls[2][0].message.value.toString())).toEqual(
    {
      name: "test2",
    },
  );
}, 30000);
