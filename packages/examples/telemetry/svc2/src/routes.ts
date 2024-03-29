import { ILogger } from "@basica/core/logger";

import { FastifyPluginAsync } from "fastify";

export const routes =
  (_logger: ILogger): FastifyPluginAsync =>
  async (fastify) => {
    const logger = _logger.child({ name: "routes" });

    fastify.post("/ping", async () => {
      logger.info("ping received");

      if (Date.now() % 2 == 0) {
        throw new Error("random error");
      }

      return "pong";
    });
  };
