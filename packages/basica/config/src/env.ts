import { ConfigProvider, ConfigSchema } from "./utils";
import { config as dotenv, DotenvConfigOptions } from "dotenv";

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
   * const schema = Type.Object({ nested: Type.Object({ value: Type.String() }) })
   * // interpolator = '_' -> env var = "NESTED_VALUE"
   * // interpolator = ':' -> env var = "NESTED:VALUE"
   */
  interpolator?: string;
  /**
   * environment variable casing
   * @default "upper"
   * const schema = Type.Object({ Nested: Type.Object({ Value: Type.String() }) })
   * // casing = 'upper' -> env var = "NESTED_VALUE"
   * // casing = 'lower' -> env var = "nested_value"
   * // casing = 'maintain' -> env var = "Nested_Value"
   */
  casing?: "upper" | "lower" | "maintain";
};

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

  const get = (schema: ConfigSchema, prefixes: string[] = []) => {
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
        if (!value) {
          value = get(val[1] as ConfigSchema, envKey);
        }
      } else {
        value = get(schema[key] as ConfigSchema, envKey);
      }

      parsed[key] = value;
    }

    return parsed;
  };

  return {
    get,
  } satisfies ConfigProvider;
};

const parseEnvValue = (val: "json" | "primitive", envVar: string) => {
  const envValue = process.env[envVar];

  if (val == "primitive") {
    return envValue;
  } else if (val == "json") {
    if (envValue == undefined) {
      // Skip if value is not set
      return;
    }

    let value: string | undefined;
    try {
      value = JSON.parse(envValue);
    } catch {
      // Value is not a JSON object/array
      try {
        value = JSON.parse(JSON.stringify(envValue));
      } catch {
        /* empty */
      }
    }
    return value;
  }
};
