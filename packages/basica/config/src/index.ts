import { StandardSchemaV1 } from "@standard-schema/spec";

import { ConfigProvider } from "./utils";

/**
 * Validates configuration from the given provider and schema
 * @param provider configuration provider {@link ConfigProvider}
 * @param schema any {@link https://standardschema.dev | Standard Schema}. The provider dictates any extra requirements: {@link envProvider} and other flat sources additionally need a {@link https://standardschema.dev/json-schema | JSON Schema} (e.g. Zod v4), while shaped providers accept any Standard Schema.
 * @returns validated config object
 * @throws validation error
 */
export const configure = <S, T extends StandardSchemaV1 & S>(
  provider: ConfigProvider<S>,
  schema: T
) => {
  const config = provider.get(schema);

  const result = schema["~standard"].validate(config);
  if (result instanceof Promise) {
    throw new Error("Asynchronous validation is not supported");
  }

  if (result.issues) {
    const msg = result.issues
      .map((issue) => formatPath(issue.path) + ": " + issue.message)
      .join("\n");
    throw new Error(msg);
  }

  return result.value as StandardSchemaV1.InferOutput<T>;
};

const formatPath = (path: StandardSchemaV1.Issue["path"]) =>
  (path ?? [])
    .map((segment) => (typeof segment === "object" ? segment.key : segment))
    .join(".");

export { envProvider } from "./env";
export { ConfigProvider } from "./utils";
