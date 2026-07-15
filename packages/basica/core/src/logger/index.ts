import pino, { BaseLogger, DestinationStream, LoggerOptions } from "pino";
import { z } from "zod";

/** Logger configuration schema */
export const loggerConfigSchema = z.object({
  /** @default "info" */
  level: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .optional(),
  /** Additional log fields */
  fields: z
    .object({
      /** @default process.env.npm_package_name */
      name: z.string().optional(),
      /** @default process.env.npm_package_version */
      version: z.string().optional(),
    })
    .optional(),
});

export type LoggerConfig = LoggerOptions &
  Partial<z.infer<typeof loggerConfigSchema>>;

/** Basica logger interface */
export type ILogger = BaseLogger &
  Readonly<{
    child: (properties: Record<string, unknown>) => ILogger;
  }>;

export type Level =
  "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";

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
