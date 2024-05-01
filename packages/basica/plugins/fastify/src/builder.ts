import {
  AppRequiredDeps,
  IHealthcheckManager,
  healthcheckResultSchema,
} from "@basica/core";
import { Constructor } from "@basica/core/utils";

import { Type } from "@sinclair/typebox";

import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { FastifyInstance } from "fastify";

import { FastifyConfig, MapHealthchecksConfig, SwaggerConfig } from "./config";
import { FastifyEntrypoint } from "./entrypoint";

export class FastifyEntrypointBuilder<D extends AppRequiredDeps> {
  readonly #deps: D;
  readonly #entrypoint: FastifyEntrypoint;
  readonly #healthchecks: IHealthcheckManager;

  constructor(
    deps: D,
    healthchecks: IHealthcheckManager,
    name: string,
    config?: FastifyConfig
  ) {
    this.#deps = deps;
    this.#entrypoint = new FastifyEntrypoint(config ?? {}, deps.logger, name);
    this.#healthchecks = healthchecks;
  }

  /**
   * Configures fastify application
   * @example
   * builder.configureApp((app, deps) =>
   *   app.useOpenApi()
   * )
   */
  configureApp(fn: (app: FastifyAppBuilder, deps: D) => void) {
    new FastifyAppBuilder(this.#entrypoint.fastify).mapRoutes("", (app) =>
      fn(new FastifyAppBuilder(app.fastify), this.#deps)
    );

    return this;
  }

  /** Maps Basica healthchecks
   * @param config healthcheck {@link MapHealthchecksConfig config}
   * @param filter filter healthchecks by name
   * @example
   * builder.mapHealthchecks()
   * @example
   * builder.mapHealthchecks({ path: "/healthcheck" })
   * @example
   * builder.mapHealthchecks({ path: "/healthcheck" }, (name) => name.contains("db"))
   */
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

  /**
   * map error
   * @param error Error class
   * @param statusCodeOrFn either number or function for dynamic logic
   * @example
   * builder.mapError(NotFoundError, 404)
   * @example
   * builder.mapError(DynamicError, (e) => e.type == "user-error" ? 400 : 500)
   */
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

  /**
   * map errors
   * @see {@link FastifyErrorMapperBuilder}
   * @param fn builder function
   * @example
   * builder.mapErrors((builder) =>
   *   builder
   *     .mapError(NotFoundError, 404)
   *     .mapError(DynamicError, (e) => e.type == "user-error" ? 400 : 500)
   * )
   */
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
  /**
   * map routes
   * @see {@link FastifyRouterBuilder}
   * @param prefix prefix path
   * @param fn builder function
   * @example
   * builder.mapRoutes("/todos", (builder) =>
   *   builder.mapErrors((builder) =>
   *     builder
   *       .mapError(NotFoundError, 404)
   *       .mapError(DynamicError, (e) => e.type == "user-error" ? 400 : 500))
   *     .fastify.register(todos)
   * )
   */
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
  /**
   * registers swagger plugins
   * @param config {@link SwaggerConfig}
   * @example
   * builder.useOpenapi()
   * @example
   * builder.useOpenapi({
   *   swagger: {
   *     openapi: {
   *       info: { title: "my-api" }
   *     }
   *   },
   *   swaggerUi: { routePrefix: "/docs" }
   * })
   */
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
