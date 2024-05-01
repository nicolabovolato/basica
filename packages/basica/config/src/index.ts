import { Static, TObject } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

import { ConfigProvider, schemaToObj } from "./utils";

/**
 * Validates configuration from the given a provider and schema
 * @param provider configuration provider {@link ConfigProvider}
 * @param schema typebox {@link TObject}
 * @returns validated config object
 * @throws validation error
 */
export const configure = <T extends TObject>(
  provider: ConfigProvider,
  schema: T
) => {
  const objSchema = schemaToObj(schema);
  const config = provider.get(objSchema);

  const result = safeParse(schema, config);

  if (!result.success) {
    const msg = [...result.errors]
      .map((e) => e.path + ": " + e.message)
      .join("\n");
    throw new Error(msg);
  }

  return result.value as Static<typeof schema>;
};

const safeParse = <T extends TObject>(T: T, value: unknown) => {
  const coerced = Value.Clean(T, Value.Default(T, Value.Convert(T, value)));

  try {
    return { value: Value.Decode(T, coerced), success: true } as const;
  } catch (e) {
    return { errors: Value.Errors(T, coerced), success: false } as const;
  }
};

export { envProvider } from "./env";
export { ConfigProvider } from "./utils";
