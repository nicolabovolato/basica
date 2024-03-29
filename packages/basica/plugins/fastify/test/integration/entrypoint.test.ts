import { loggerFactory } from "@basica/core/logger";
import { FastifyConfig } from "src/config";
import { FastifyEntrypoint } from "src/entrypoint";
import { expect, test } from "vitest";
import { fetch } from "undici";

const host = "localhost";
const port = 8080;
const url = `http://${host}:${port}`;
const logger = loggerFactory({ level: "silent" });
const config: FastifyConfig = {
  host,
  port,
};
const name = "fastify";

test("starts/stops", async () => {
  const signal = new AbortController().signal;
  const entrypoint = new FastifyEntrypoint(config, logger, name);
  entrypoint.fastify.get("/", () => "OK");

  await expect(fetch(url)).rejects.toThrowError();

  await entrypoint.start(signal);

  const res = await fetch(`http://${host}:${port}`);
  expect(await res.text()).toBe("OK");

  await entrypoint.shutdown();

  await expect(fetch(url)).rejects.toThrowError();
});
