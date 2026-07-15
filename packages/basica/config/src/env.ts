import { StandardJSONSchemaV1 } from "@standard-schema/spec";
import { config as dotenv, DotenvConfigOptions } from "dotenv";
import { JSONSchema7 } from "json-schema";
import { ConfigProvider, ConfigSchema, Leaf, schemaToObj } from "./utils";

/** {@link envProvider} configuration */
export type Config = {
  /**
   * Dotenv config options
   * @see {@link DotenvConfigOptions}
   * @default undefined
   */
  dotenv?: DotenvConfigOptions;
  /**
   * environment variable interpolator
   * @default "_"
   * @example
   * const schema = z.object({ nested: z.object({ value: z.string() }) })
   * // interpolator = '_' -> env var = "NESTED_VALUE"
   * // interpolator = ':' -> env var = "NESTED:VALUE"
   */
  interpolator?: string;
  /**
   * environment variable casing
   * @default "upper"
   * const schema = z.object({ Nested: z.object({ Value: z.string() }) })
   * // casing = 'upper' -> env var = "NESTED_VALUE"
   * // casing = 'lower' -> env var = "nested_value"
   * // casing = 'maintain' -> env var = "Nested_Value"
   */
  casing?: "upper" | "lower" | "maintain";
};

type ReadOptions = Required<Pick<Config, "interpolator" | "casing">>;

/**
 * Environment variables config provider
 * @param config envProvider configuration {@link Config}
 */
export const envProvider = (config?: Config) => {
  const {
    dotenv: dotenvConfig,
    interpolator = "_",
    casing = "upper",
  } = config ?? {};

  dotenv(dotenvConfig);

  const get = (schema: StandardJSONSchemaV1) =>
    readEnv(
      schemaToObj(
        schema["~standard"].jsonSchema.input({
          target: "draft-07",
        }) as JSONSchema7,
      ),
      { interpolator, casing },
    );

  return {
    get,
  } satisfies ConfigProvider<StandardJSONSchemaV1> as ConfigProvider<StandardJSONSchemaV1>;
};

export const readEnv = (
  schema: ConfigSchema,
  options: ReadOptions,
  prefixes: string[] = [],
) => {
  const { interpolator, casing } = options;
  const parsed: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(schema)) {
    const casedKey =
      casing == "upper"
        ? key.toUpperCase()
        : casing == "lower"
          ? key.toLowerCase()
          : key;
    const envKey = [...prefixes, casedKey];
    const envKeyStr = envKey.join(interpolator);

    let value: unknown;

    if (typeof val == "string") {
      value = parseEnvValue(val, envKeyStr);
    } else if (Array.isArray(val)) {
      value = parseEnvValue(val[0], envKeyStr);
      if (value === undefined) {
        value = readEnv(val[1], options, envKey);
      }
    } else {
      value = readEnv(val, options, envKey);
    }

    parsed[key] = value;
  }

  return parsed;
};

const parseEnvValue = (leaf: Leaf, envVar: string) => {
  const raw = process.env[envVar];
  if (raw === undefined) return undefined;

  switch (leaf) {
    case "string":
      return raw;
    case "number":
    case "integer": {
      const num = Number(raw);
      // leave unparseable values untouched so validation reports them
      return Number.isNaN(num) ? raw : num;
    }
    case "boolean":
      if (raw === "true" || raw === "1") return true;
      if (raw === "false" || raw === "0") return false;
      return raw;
    case "json":
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        // not a JSON object/array, treat as a plain string
        try {
          return JSON.parse(JSON.stringify(raw)) as unknown;
        } catch {
          return undefined;
        }
      }
  }
};
