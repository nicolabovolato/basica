import { SwaggerOptions } from "@fastify/swagger";
import { FastifySwaggerUiOptions } from "@fastify/swagger-ui";
import { Static, Type } from "@sinclair/typebox";
import { FastifyListenOptions, FastifyServerOptions } from "fastify";

export type FastifyRuntimeConfig = Required<
  Pick<FastifyListenOptions, "port" | "host">
>;

export type FastifyConfig = FastifyServerOptions &
  Static<typeof fastifyConfigSchema>;

export const fastifyConfigSchema = Type.Object({
  host: Type.Optional(Type.String()),
  port: Type.Optional(Type.Number()),
});

export type MapHealthchecksConfig = Partial<
  Static<typeof mapHealthchecksConfigSchema>
>;

export const mapHealthchecksConfigSchema = Type.Object({
  path: Type.Optional(Type.String()),
  healthyStatusCode: Type.Optional(Type.Number({ minimum: 200, maximum: 299 })),
  unhealthyStatusCode: Type.Optional(
    Type.Number({
      minimum: 400,
      maximum: 599,
    })
  ),
});

export type SwaggerConfig = {
  swagger?: SwaggerOptions & Static<typeof swaggerConfigSchema>;
  swaggerUi?: FastifySwaggerUiOptions;
};

export const swaggerConfigSchema = Type.Object({
  openapi: Type.Optional(
    Type.Object({
      info: Type.Object({
        title: Type.String(),
        version: Type.String(),
        description: Type.Optional(Type.String()),
      }),
    })
  ),
});
