import {
  AppRequiredServices,
  IHealthcheckManager,
  healthcheckResultSchema,
} from "@basica/core";
import { Constructor } from "@basica/core/utils";

import { Type } from "@sinclair/typebox";

import { FastifyInstance } from "fastify";
import swaggerUi from "@fastify/swagger-ui";
import swagger from "@fastify/swagger";

import { FastifyConfig, MapHealthchecksConfig, SwaggerConfig } from "./config";
import { FastifyEntrypoint } from "./entrypoint";

export class FastifyEntrypointBuilder<S extends AppRequiredServices> {
  readonly #services: S;
  readonly #entrypoint: FastifyEntrypoint;
  readonly #healthchecks: IHealthcheckManager;

  constructor(
    services: S,
    healthchecks: IHealthcheckManager,
    name: string,
    config?: FastifyConfig
  ) {
    this.#services = services;
    this.#entrypoint = new FastifyEntrypoint(
      config ?? {},
      services.logger,
      name
    );
    this.#healthchecks = healthchecks;
  }

  configureApp(fn: (app: FastifyAppBuilder, services: S) => void) {
    new FastifyAppBuilder(this.#entrypoint.fastify).mapRoutes("", (app) =>
      fn(new FastifyAppBuilder(app.fastify), this.#services)
    );

    return this;
  }

  mapHealthchecks(
    config?: MapHealthchecksConfig,
    filter?: (name: string) => boolean
  ) {
    const { path, healthyStatusCode, unhealthyStatusCode } = {
      path: "/health",
      healthyStatusCode: 200,
      unhealthyStatusCode: 500,
      ...(config ?? {}),
    };

    const schema = Type.Object({
      status: Type.Index(healthcheckResultSchema, ["status"]),
      healthchecks: Type.Array(
        Type.Intersect([
          Type.Omit(healthcheckResultSchema, ["error"]),
          Type.Object({
            name: Type.String(),
          }),
        ])
      ),
    });

    this.#entrypoint.fastify.get(
      path,
      {
        schema: {
          response: {
            [healthyStatusCode.toString()]: schema,
            [unhealthyStatusCode.toString()]: schema,
          },
        },
      },
      async (_req, res) => {
        const result = await this.#healthchecks.healthcheck(filter);

        const resultArray = Object.entries(result).map(([key, value]) => ({
          name: key,
          ...value,
        }));

        const unhealthy = resultArray.reduce(
          (acc, r) => acc || r.status == "unhealthy",
          false
        );

        return res
          .status(unhealthy ? unhealthyStatusCode : healthyStatusCode)
          .send({
            status: unhealthy ? "unhealthy" : "healthy",
            healthchecks: resultArray,
          });
      }
    );

    return this;
  }

  build() {
    return this.#entrypoint;
  }
}

type HttpErrorMap = Map<Constructor<Error>, (e: Error) => number>;

export class FastifyErrorMapperBuilder {
  #errors: HttpErrorMap = new Map();

  mapError<T extends Error>(
    error: Constructor<T>,
    statusCodeOrFn: ((e: T) => number) | number
  ) {
    this.#errors.set(
      error,
      typeof statusCodeOrFn == "number"
        ? () => statusCodeOrFn
        : (statusCodeOrFn as (e: Error) => number)
    );
    return this;
  }
  build() {
    return this.#errors;
  }
}

export class FastifyRouterBuilder {
  constructor(readonly fastify: FastifyInstance) {}

  mapErrors(
    fn: (builder: FastifyErrorMapperBuilder) => FastifyErrorMapperBuilder
  ) {
    const map = fn(new FastifyErrorMapperBuilder()).build();

    this.fastify.setErrorHandler(async (err, req, res) => {
      const statusCodeFn = map.get(
        (err as Error).constructor as Constructor<Error>
      );

      if (statusCodeFn) {
        const statusCode = statusCodeFn(err);
        return res.status(statusCode).send({
          statusCode,
          error: err.name,
          message: err.message,
        });
      }

      throw err;
    });

    return this;
  }

  // TODO: any better name? (addController or some stuff)
  mapRoutes(prefix: string, fn: (builder: FastifyRouterBuilder) => void) {
    this.fastify.register(
      (fastify, _options, next) => {
        fn(new FastifyRouterBuilder(fastify));
        next();
      },
      { prefix }
    );

    return this;
  }

  //TODO: Auth?
}

export class FastifyAppBuilder extends FastifyRouterBuilder {
  useOpenapi(config?: SwaggerConfig) {
    const { swagger: swaggerCfg, swaggerUi: swaggerUiCfg } = config ?? {};

    this.fastify.register(swagger, {
      ...swaggerCfg,
      ...{
        openapi: {
          info: {
            title:
              swaggerCfg?.openapi?.info.title ??
              process.env.npm_package_name ??
              "",
            version:
              swaggerCfg?.openapi?.info.title ??
              process.env.npm_package_version ??
              "",
            description:
              swaggerCfg?.openapi?.info.description ??
              process.env.npm_package_description,
          },
        },
      },
    });
    this.fastify.register(swaggerUi, swaggerUiCfg);
    return this;
  }
}