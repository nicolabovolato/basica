import { expect, inject, test } from "vitest";

import { getTestApp } from "../utils";

const pgUrl = inject("pgUrl");

test("start/stop", async () => {
  const app = getTestApp(pgUrl);

  const startResult = await app.lifecycle.start();
  const stopResult = await app.lifecycle.stop();

  expect(startResult).toBe(true);
  expect(stopResult).toBe(true);
}, 15000);
