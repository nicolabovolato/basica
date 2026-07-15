import { describe, expect, inject, test } from "vitest";

import { getKafkaClient } from "./utils";

const broker = inject("kafkaBroker");

describe.each([
  ["producer", undefined],
  ["consumer", { groupId: test }],
  ["admin", undefined],
] as const)("Kafka (%s)", (fn, config) => {
  test("healthcheck", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getKafkaClient(broker)[fn](config as any);
    expect(await client.healthcheck()).toEqual({ status: "unhealthy" });
    await client.start();
    expect(await client.healthcheck()).toEqual({ status: "healthy" });
    await client.shutdown();
    expect(await client.healthcheck()).toEqual({ status: "unhealthy" });
  }, 20000);

  test("start", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getKafkaClient(broker)[fn](config as any);
    await client.start();
  }, 20000);

  test("shutdown", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = getKafkaClient(broker)[fn](config as any);
    await client.shutdown();
  }, 20000);
});
