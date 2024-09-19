import { IEntrypoint } from "@basica/core";
import { ILogger } from "@basica/core/logger";

import fastify, { FastifyInstance } from "fastify";

import { FastifyConfig, FastifyRuntimeConfig } from "./config";

// TODO: basic metrics?
export class FastifyEntrypoint implements IEntrypoint {
  readonly fastify: FastifyInstance;
  readonly #runtimeConfig: FastifyRuntimeConfig;

  constructor(config: FastifyConfig, logger: ILogger, name: string) {
    const { host = "0.0.0.0", port = 8080 } = config;

    this.#runtimeConfig = { host, port };

    this.fastify = fastify({
      loggerInstance: logger.child({
        name: `@basica:entrypoint:fastify:${name}`,
      }),
      ajv: {
        customOptions: {
          removeAdditional: "failing",
        },
      },
      ignoreTrailingSlash: true,
      ...config,
    });

    this.fastify.setErrorHandler(async (err, req, res) => {
      if (err.statusCode) throw err; // Leave to the root error handler if the error is a fastify error

      res.status(500);
      res.log.error({ err, req, res }, err.message);
      res.send({
        statusCode: 500,
        error: "Internal server error",
        message: "Internal server error",
      });
    });
  }

  async start(signal: AbortSignal): Promise<void> {
    await this.fastify.listen({ ...this.#runtimeConfig, signal });
  }

  async shutdown(): Promise<void> {
    await this.fastify.close();
  }
}
