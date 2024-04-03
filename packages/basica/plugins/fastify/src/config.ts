import { SwaggerOptions } from "@fastify/swagger";
import { FastifySwaggerUiOptions } from "@fastify/swagger-ui";
import { Static, Type } from "@sinclair/typebox";
import { FastifyListenOptions, FastifyServerOptions } from "fastify";

export type FastifyRuntimeConfig = Required<
  Pick<FastifyListenOptions, "port" | "host">
>;

/**
 * `ignoreTrailingSlash` is `true` by default
 *
 * `ajv.customOptions.removeAdditional` is `"all"` by default
 * @see {@link FastifyServerOptions}
 * */
export type FastifyConfig = FastifyServerOptions &
  Static<typeof fastifyConfigSchema>;

/** Fastify configuration schema */
export const fastifyConfigSchema = Type.Object({
  /** @default "0.0.0.0" */
  host: Type.Optional(Type.String()),
  /** @default 8080 */
  port: Type.Optional(Type.Number()),
});

export type MapHealthchecksConfig = Partial<
  Static<typeof mapHealthchecksConfigSchema>
>;

/** Fastify healthcheck configuration schema */
export const mapHealthchecksConfigSchema = Type.Object({
  /** @default "/health" */
  path: Type.Optional(Type.String()),
  /** @default 200 */
  healthyStatusCode: Type.Optional(Type.Number({ minimum: 200, maximum: 299 })),
  /** @default 500 */
  unhealthyStatusCode: Type.Optional(
    Type.Number({
      minimum: 400,
      maximum: 599,
    })
  ),
});

export type SwaggerConfig = {
  /** @see {@link SwaggerOptions} */
  swagger?: SwaggerOptions & Static<typeof swaggerConfigSchema>;
  /** @see {@link FastifySwaggerUiOptions} */
  swaggerUi?: FastifySwaggerUiOptions;
};

/** Fastify swagger configuration schema */
export const swaggerConfigSchema = Type.Object({
  openapi: Type.Optional(
    Type.Object({
      info: Type.Object({
        /** @default process.env.npm_package_name */
        title: Type.String(),
        /** @default process.env.npm_package_version */
        version: Type.String(),
        /** @default process.env.npm_package_description */
        description: Type.Optional(Type.String()),
      }),
    })
  ),
});
