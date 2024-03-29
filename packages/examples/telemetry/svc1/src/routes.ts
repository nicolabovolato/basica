import { FastifyPluginAsync } from "fastify";

import { Svc2 } from "./svc2";

export const routes =
  (svc2: Svc2): FastifyPluginAsync =>
  async (fastify) => {
    fastify.post("/request", async () => {
      await svc2.ping();
      return "OK";
    });
  };
