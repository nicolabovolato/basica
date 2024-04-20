import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { KafkaContainer, StartedKafkaContainer } from "@testcontainers/kafka";
import { getKafkaClient } from "./utils";

let kafka: StartedKafkaContainer;

beforeAll(async () => {
  kafka = await new KafkaContainer("confluentinc/cp-kafka:7.6.1")
    .withKraft()
    .withExposedPorts(9093)
    .start();
}, 60000);

afterAll(async () => {
  await kafka.stop();
}, 10000);

describe.each([
  ["producer", undefined],
  ["consumer", { groupId: test }],
  ["admin", undefined],
] as const)("Kafka (%s)", (fn, config) => {
  test("healthcheck", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getKafkaClient(kafka)[fn](config as any);
    expect(await client.healthcheck()).toEqual({ status: "unhealthy" });
    await client.start();
    expect(await client.healthcheck()).toEqual({ status: "healthy" });
    await client.shutdown();
    expect(await client.healthcheck()).toEqual({ status: "unhealthy" });
  });

  test("start", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getKafkaClient(kafka)[fn](config as any);
    await client.start();
  });

  test("shutdown", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getKafkaClient(kafka)[fn](config as any);
    await client.shutdown();
  });
});
