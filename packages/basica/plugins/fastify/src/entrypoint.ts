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
      routerOptions: { ignoreTrailingSlash: true },
      ...config,
    });

    this.fastify.setErrorHandler(async (error, req, res) => {
      // Is this error @fastify/error? Leave to the root error handler, best effort check
      if (
        error instanceof Error &&
        "statusCode" in error &&
        typeof error.statusCode == "number" &&
        error.statusCode >= 400 &&
        error.statusCode <= 599
      ) {
        throw error;
      }

      res.status(500);
      res.log.error({ err: error, req, res }, "Unhandled error");
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
