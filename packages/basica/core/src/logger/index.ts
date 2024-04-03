import { Static, Type } from "@sinclair/typebox";
import pino, { LoggerOptions, BaseLogger, DestinationStream } from "pino";

/** Logger configuration schema */
export const loggerConfigSchema = Type.Object({
  /** @default "info" */
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
  /** Additional log fields */
  fields: Type.Optional(
    Type.Object({
      /** @default process.env.npm_package_name */
      name: Type.Optional(Type.String()),
      /** @default process.env.npm_package_version */
      version: Type.Optional(Type.String()),
    })
  ),
});

export type LoggerConfig = LoggerOptions &
  Partial<Static<typeof loggerConfigSchema>>;

/** Basica logger interface */
export type ILogger = BaseLogger &
  Readonly<{
    child: (properties: Record<string, unknown>) => ILogger;
  }>;

// TODO: worker thread transport?
/**
 * creates a logger instance
 * @param stream pino {@link DestinationStream}
 */
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
