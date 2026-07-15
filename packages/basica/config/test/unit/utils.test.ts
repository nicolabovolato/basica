import { JSONSchema7 } from "json-schema";
import { schemaToObj } from "src/utils";
import { expect, test } from "vitest";
import { z } from "zod";

const toObj = (schema: z.ZodType) =>
  schemaToObj(
    schema["~standard"].jsonSchema.input({ target: "draft-07" }) as JSONSchema7,
  );

test.each([
  [
    z.object({
      test: z.number(),
      nested: z.object({
        test1: z.array(z.string()),
        test2: z.record(z.string(), z.unknown()),
        nested: z.object({
          test: z.unknown(),
        }),
      }),
    }),
    {
      test: "number",
      nested: {
        test1: "json",
        test2: "json",
        nested: {
          test: "json",
        },
      },
    },
  ],
  [
    z.object({
      value: z.string(),
    }),
    {
      value: "string",
    },
  ],
  [
    z.object({
      port: z.number(),
      big: z.int(),
      enabled: z.boolean(),
    }),
    {
      port: "number",
      big: "integer",
      enabled: "boolean",
    },
  ],
  [
    z.object({
      value: z.union([z.string(), z.number()]),
    }),
    {
      value: "string",
    },
  ],
  [
    z.object({
      value: z.union([z.string(), z.number(), z.object({ x: z.string() })]),
    }),
    {
      value: ["string", { x: "string" }],
    },
  ],
  [
    z.object({
      value: z.union([z.literal("fatal"), z.literal("error")]),
    }),
    {
      value: "json",
    },
  ],
  [
    z.object({
      union1: z.union([z.record(z.string(), z.unknown()), z.string()]),
      union2: z.union([z.string(), z.array(z.string())]),
      union3: z.union([z.string(), z.object({ value: z.string() })]),
      union4: z.union([
        z.record(z.string(), z.unknown()),
        z.object({ value: z.string() }),
      ]),
      union5: z.union([z.array(z.string()), z.object({ value: z.string() })]),
      union6: z.union([
        z.array(z.string()),
        z.object({ value: z.array(z.string()) }),
      ]),
      union7: z.union([z.array(z.string()), z.record(z.string(), z.unknown())]),
      union8: z.union([
        z.object({ x: z.string() }),
        z.object({ y: z.string() }),
      ]),
      union9: z.union([
        z.object({ x: z.string() }),
        z.object({ x: z.string(), y: z.string() }),
      ]),
    }),
    {
      union1: "json",
      union2: "json",
      union3: ["string", { value: "string" }],
      union4: ["json", { value: "string" }],
      union5: ["json", { value: "string" }],
      union6: ["json", { value: "json" }],
      union7: "json",
      union8: {
        x: "string",
        y: "string",
      },
      union9: {
        x: "string",
        y: "string",
      },
    },
  ],
  [
    z.object({
      value: z.union([
        z.object({ y: z.string() }),
        z.object({ x: z.string() }),
        z.object({ z: z.string() }),
      ]),
    }),
    {
      value: {
        x: "string",
        y: "string",
        z: "string",
      },
    },
  ],
  [
    z.object({
      value: z.intersection(
        z.object({ y: z.string() }),
        z.intersection(
          z.object({ x: z.string() }),
          z.object({ z: z.string() }),
        ),
      ),
    }),
    {
      value: {
        x: "string",
        y: "string",
        z: "string",
      },
    },
  ],
  [
    z.object({
      value: z.intersection(
        z.union([z.object({ y: z.string() }), z.object({ x: z.string() })]),
        z.object({ z: z.string() }),
      ),
    }),
    {
      value: {
        x: "string",
        y: "string",
        z: "string",
      },
    },
  ],
  [
    z.object({
      x: z.intersection(
        z.union([
          z.object({
            connectionString: z.string(),
          }),
          z.object({
            host: z.string(),
            port: z.number(),
            database: z.string().optional(),
            username: z.string().optional(),
            password: z.string().optional(),
          }),
        ]),
        z.object({
          connectionTimeoutMillis: z.number(),
        }),
      ),
    }),
    {
      x: {
        connectionString: "string",
        host: "string",
        port: "number",
        database: "string",
        username: "string",
        password: "string",
        connectionTimeoutMillis: "number",
      },
    },
  ],
  [
    z.object({
      nodes: z.array(z.object({ host: z.string(), port: z.number() })),
      timeout: z.number(),
    }),
    {
      nodes: "json",
      timeout: "number",
    },
  ],
])("transforms standard schema %#", (schema, expected) => {
  expect(toObj(schema)).toEqual(expected);
});

test.each([
  z.object({
    value: z.intersection(z.string(), z.number()),
  }),
  z.object({
    value: z.intersection(z.array(z.string()), z.number()),
  }),
  z.object({
    value: z.intersection(
      z.array(z.string()),
      z.record(z.string(), z.unknown()),
    ),
  }),
  z.object({
    value: z.intersection(
      z.object({ x: z.string() }),
      z.object({ x: z.array(z.string()) }),
    ),
  }),
  z.object({
    value: z.intersection(
      z.union([z.object({ x: z.string() })]),
      z.union([
        z.object({ y: z.string(), x: z.record(z.string(), z.unknown()) }),
      ]),
    ),
  }),
])("fails with untransformable standard schema %#", (schema) => {
  expect(() => toObj(schema)).toThrow();
});
