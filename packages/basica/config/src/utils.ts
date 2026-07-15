import { JSONSchema7, JSONSchema7Definition } from "json-schema";

type Scalar = "string" | "number" | "integer" | "boolean";

/** How the provider should read a single value from a flat source. */
export type Leaf = Scalar | "json";

export interface ConfigSchema {
  [key: string]: ConfigSchemaValue;
}

/**
 * A resolved schema value: a leaf, a nested object, or a `[leaf, object]`
 * fallback produced by a union that mixes a leaf branch with an object branch
 * ("read the leaf, otherwise read the object").
 */
type ConfigSchemaValue = Leaf | ConfigSchema | [Leaf, ConfigSchema];

export type ConfigProvider<S = unknown> = {
  get(schema: S): Record<string, unknown>;
};

const isScalar = (value: ConfigSchemaValue): value is Scalar =>
  value === "string" ||
  value === "number" ||
  value === "integer" ||
  value === "boolean";

const isObject = (value: ConfigSchemaValue): value is ConfigSchema =>
  typeof value === "object" && !Array.isArray(value);

const unifyScalars = (scalars: Scalar[]) =>
  scalars.every((scalar) => scalar === scalars[0]) ? scalars[0] : "string";

const getUnionType = (schemas: JSONSchema7Definition[]): ConfigSchemaValue => {
  const kinds = schemas.map(matchKind);
  if (kinds.some(Array.isArray))
    throw new Error("Cannot resolve a union of unions");

  const scalars = kinds.filter(isScalar);
  const objects = kinds.filter(isObject);

  if (scalars.length === kinds.length) return unifyScalars(scalars);
  if (objects.length === 0) return "json";

  const merged = objects.reduce(mergeConfigSchemas);
  if (kinds.includes("json")) return ["json", merged];
  if (scalars.length > 0) return [unifyScalars(scalars), merged];
  return merged;
};

const getIntersectionType = (schemas: JSONSchema7Definition[]): ConfigSchema =>
  schemas
    .map(matchKind)
    .map((kind) => {
      if (!isObject(kind)) throw new Error("Can only intersect object types");
      return kind;
    })
    .reduce(mergeConfigSchemas, {});

const mergeConfigSchemas = (a: ConfigSchema, b: ConfigSchema): ConfigSchema => {
  const merged: ConfigSchema = { ...a };

  for (const [key, incoming] of Object.entries(b)) {
    const existing = merged[key];

    if (existing === undefined || existing === incoming) {
      merged[key] = incoming;
    } else if (isObject(existing) && isObject(incoming)) {
      merged[key] = mergeConfigSchemas(existing, incoming);
    } else {
      throw new Error(`Cannot merge conflicting config key "${key}"`);
    }
  }

  return merged;
};

const isPrimitive = (schema: JSONSchema7) => {
  // const/enum pin an exact value set (e.g. a log-level literal union); the
  // provider round-trips them as json rather than coercing them like scalars.
  if (schema.const !== undefined || schema.enum !== undefined) return false;

  const { type } = schema;
  return (
    type === "string" ||
    type === "number" ||
    type === "integer" ||
    type === "boolean"
  );
};

const matchKind = (schema: JSONSchema7Definition): ConfigSchemaValue => {
  if (typeof schema === "boolean") return "json";

  if (isPrimitive(schema)) return schema.type as Scalar;
  if (schema.properties) return schemaToObj(schema);
  if (schema.anyOf) return getUnionType(schema.anyOf);
  if (schema.allOf) return getIntersectionType(schema.allOf);

  return "json";
};

/**
 * Resolves a JSON Schema into a flat read plan describing, for each key,
 * whether the provider should read a scalar, a json value, or recurse.
 */
export const schemaToObj = (schema: JSONSchema7): ConfigSchema => {
  const parsed: ConfigSchema = {};

  for (const [key, prop] of Object.entries(schema.properties ?? {})) {
    parsed[key] = matchKind(prop);
  }

  return parsed;
};
