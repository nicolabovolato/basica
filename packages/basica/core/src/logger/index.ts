import { Static, Type } from "@sinclair/typebox";
import pino, { LoggerOptions, BaseLogger, DestinationStream } from "pino";

export const loggerConfigSchema = Type.Object({
  level: Type.Optional(
    Type.Union([
      Type.Literal("fatal"),
      Type.Literal("error"),
      Type.Literal("warn"),
      Type.Literal("info"),
      Type.Literal("debug"),
      Type.Literal("trace"),
      Type.Literal("silent"),
    ])
  ),
  fields: Type.Optional(
    Type.Object({
      name: Type.Optional(Type.String()),
      version: Type.Optional(Type.String()),
    })
  ),
});

export type LoggerConfig = LoggerOptions &
  Partial<Static<typeof loggerConfigSchema>>;

export type ILogger = BaseLogger &
  Readonly<{
    child: (properties: Record<string, unknown>) => ILogger;
  }>;

// TODO: worker thread transport?
export const loggerFactory = (
  config?: LoggerConfig,
  stream?: DestinationStream
) => {
  const { fields, ...pinoConfig } = config ?? {};

  return pino(
    { ...pinoConfig, level: pinoConfig.level ?? "info" },
    stream
  ).child({
    app: {
      name: fields?.name ?? process.env.npm_package_name,
      version: fields?.version ?? process.env.npm_package_version,
    },
  }) as ILogger;
};
