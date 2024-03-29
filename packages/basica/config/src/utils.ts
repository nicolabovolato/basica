import { Kind, TIntersect, TObject, TSchema, TUnion } from "@sinclair/typebox";

export interface ConfigSchema {
  [key: string]: ConfigSchemaValue;
}

type ConfigSchemaValue =
  | "primitive"
  | "json"
  | ConfigSchema
  | ["primitive" | "json", ConfigSchema];

export type ConfigProvider = {
  get(schema: ConfigSchema): Record<string, unknown>;
};

const getUnionType = (schemas: TSchema[]) => {
  let primitives = 0;
  let jsons = 0;
  const configSchemas: TSchema[] = [];

  for (const schema of schemas) {
    const type = matchKind(schema);
    if (type == "primitive") primitives++;
    else if (type == "json") jsons++;
    else if (typeof type == "object") configSchemas.push(schema);
  }

  if (primitives == schemas.length) return "primitive";
  if (jsons == schemas.length || configSchemas.length == 0) return "json";

  const intersected = getIntersectionType(configSchemas);
  if (jsons > 0) return ["json", intersected] as ConfigSchemaValue;
  if (primitives > 0) return ["primitive", intersected] as ConfigSchemaValue;

  return intersected;
};

const getIntersectionType = (schemas: TSchema[]) => {
  const configSchemas: ConfigSchema[] = [];

  for (const schema of schemas) {
    const type = matchKind(schema);
    if (type == "primitive")
      throw new Error("Cannot intersect primitive types");
    else if (type == "json") throw new Error("Cannot intersect json types");
    else if (Array.isArray(type))
      throw new Error("Cannot intersect union types");

    configSchemas.push(type);
  }

  return configSchemas.reduce((acc, curr) => mergeConfigSchemas(acc, curr), {});
};

const mergeConfigSchemas = (a: ConfigSchema, b: ConfigSchema) => {
  const merged = { ...a };

  for (const [key, val] of Object.entries(b)) {
    const mergedVal = merged[key];

    if (mergedVal && mergedVal != val) {
      if (
        Array.isArray(mergedVal) ||
        Array.isArray(val) ||
        typeof mergedVal != "object" ||
        typeof val != "object"
      ) {
        throw new Error("Cannot merge union/primitive types");
      }
      merged[key] = mergeConfigSchemas(mergedVal, val);
    } else {
      merged[key] = val;
    }
  }

  return merged;
};

const isPrimitive = (schema: TSchema) => {
  switch (schema[Kind]) {
    case "String":
    case "Number":
    case "Boolean":
      return true;
    default:
      return false;
  }
};

const matchKind = (schema: TSchema): ConfigSchemaValue => {
  if (isPrimitive(schema)) return "primitive";

  switch (schema[Kind]) {
    case "Object":
      return schemaToObj(schema as TObject);
    case "Union":
      return getUnionType((schema as TUnion).anyOf);
    case "Intersect":
      return getIntersectionType((schema as TIntersect).allOf);
    default:
      return "json";
  }
};

export const schemaToObj = (schema: TObject) => {
  const parsed: ConfigSchema = {};

  for (const [key, prop] of Object.entries(schema.properties)) {
    parsed[key] = matchKind(prop);
  }

  return parsed;
};
