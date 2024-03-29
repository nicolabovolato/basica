import { ConfigProvider, ConfigSchema } from "./utils";
import { config as dotenv, DotenvConfigOptions } from "dotenv";

export type Config = {
  dotenv?: DotenvConfigOptions;
  interpolator?: string;
  casing?: "upper" | "lower" | "maintain";
};

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
