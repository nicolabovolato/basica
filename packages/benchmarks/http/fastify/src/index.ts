const time = process.hrtime();

import { fastify } from "fastify";

const server = fastify({ logger: true }).get("/", async () => {});

server.listen({ port: 8080, host: "0.0.0.0" }).then(() => {
  const diff = process.hrtime(time);
  const ms = (diff[0] * 1e9 + diff[1]) / 1e6;
  console.log(`STARTUP_TIME: ${ms}ms`);
});
