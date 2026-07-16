import { SwaggerOptions } from "@fastify/swagger";
import { FastifySwaggerUiOptions } from "@fastify/swagger-ui";
import { FastifyListenOptions, FastifyServerOptions } from "fastify";
import { z } from "zod";

export type FastifyRuntimeConfig = Required<
  Pick<FastifyListenOptions, "port" | "host">
>;

/**
 * `routerOptions.ignoreTrailingSlash` is `true` by default
 *
 * `ajv.customOptions.removeAdditional` is `"failing"` by default
 * @see {@link FastifyServerOptions}
 * */
export type FastifyConfig = FastifyServerOptions &
  z.infer<typeof fastifyConfigSchema>;

/** Fastify configuration schema */
export const fastifyConfigSchema = z.object({
  /** @default "0.0.0.0" */
  host: z.string().optional(),
  /** @default 8080 */
  port: z.number().optional(),
});

export type MapHealthchecksConfig = Partial<
  z.infer<typeof mapHealthchecksConfigSchema>
>;

/** Fastify healthcheck configuration schema */
export const mapHealthchecksConfigSchema = z.object({
  /** @default "/health" */
  path: z.string().optional(),
  /** @default 200 */
  healthyStatusCode: z.number().min(200).max(299).optional(),
  /** @default 500 */
  unhealthyStatusCode: z.number().min(400).max(599).optional(),
});

export type SwaggerConfig = {
  /** @see {@link SwaggerOptions} */
  swagger?: SwaggerOptions & z.infer<typeof swaggerConfigSchema>;
  /** @see {@link FastifySwaggerUiOptions} */
  swaggerUi?: FastifySwaggerUiOptions;
};

/** Fastify swagger configuration schema */
export const swaggerConfigSchema = z.object({
  openapi: z
    .object({
      info: z.object({
        /** @default process.env.npm_package_name */
        title: z.string(),
        /** @default process.env.npm_package_version */
        version: z.string(),
        /** @default process.env.npm_package_description */
        description: z.string().optional(),
      }),
    })
    .optional(),
});
