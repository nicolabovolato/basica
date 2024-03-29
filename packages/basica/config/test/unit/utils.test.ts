import { Type } from "@sinclair/typebox";
import { schemaToObj } from "src/utils";
import { expect, test } from "vitest";

test.each([
  [
    Type.Object({
      test: Type.Number(),
      nested: Type.Object({
        test1: Type.Array(Type.String()),
        test2: Type.Record(Type.String(), Type.Unknown()),
        nested: Type.Object({
          test: Type.Date(),
        }),
      }),
    }),
    {
      test: "primitive",
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
    Type.Object({
      value: Type.String(),
    }),
    {
      value: "primitive",
    },
  ],
  [
    Type.Object({
      value: Type.Union([Type.String(), Type.Number()]),
    }),
    {
      value: "primitive",
    },
  ],
  [
    Type.Object({
      value: Type.Union([
        Type.String(),
        Type.Number(),
        Type.Object({ x: Type.String() }),
      ]),
    }),
    {
      value: [
        "primitive",
        {
          x: "primitive",
        },
      ],
    },
  ],
  [
    Type.Object({
      union1: Type.Union([
        Type.Record(Type.String(), Type.Unknown()),
        Type.String(),
      ]),
      union2: Type.Union([Type.String(), Type.Array(Type.String())]),
      union3: Type.Union([
        Type.String(),
        Type.Object({ value: Type.String() }),
      ]),
      union4: Type.Union([
        Type.Record(Type.String(), Type.Unknown()),
        Type.Object({ value: Type.String() }),
      ]),
      union5: Type.Union([
        Type.Array(Type.String()),
        Type.Object({ value: Type.String() }),
      ]),
      union6: Type.Union([
        Type.Array(Type.String()),
        Type.Object({ value: Type.Array(Type.String()) }),
      ]),
      union7: Type.Union([
        Type.Array(Type.String()),
        Type.Record(Type.String(), Type.Unknown()),
      ]),
      union8: Type.Union([
        Type.Object({ x: Type.String() }),
        Type.Object({ y: Type.String() }),
      ]),
      union9: Type.Union([
        Type.Object({ x: Type.String() }),
        Type.Object({ x: Type.String(), y: Type.String() }),
      ]),
    }),
    {
      union1: "json",
      union2: "json",
      union3: ["primitive", { value: "primitive" }],
      union4: ["json", { value: "primitive" }],
      union5: ["json", { value: "primitive" }],
      union6: ["json", { value: "json" }],
      union7: "json",
      union8: {
        x: "primitive",
        y: "primitive",
      },
      union9: {
        x: "primitive",
        y: "primitive",
      },
    },
  ],
  [
    Type.Object({
      value: Type.Union([
        Type.Object({ y: Type.String() }),
        Type.Object({ x: Type.String() }),
        Type.Object({ z: Type.String() }),
      ]),
    }),
    {
      value: {
        x: "primitive",
        y: "primitive",
        z: "primitive",
      },
    },
  ],
  [
    Type.Object({
      value: Type.Intersect([
        Type.Object({ y: Type.String() }),
        Type.Object({ x: Type.String() }),
        Type.Object({ z: Type.String() }),
      ]),
    }),
    {
      value: {
        x: "primitive",
        y: "primitive",
        z: "primitive",
      },
    },
  ],
  [
    Type.Object({
      value: Type.Intersect([
        Type.Union([
          Type.Object({ y: Type.String() }),
          Type.Object({ x: Type.String() }),
        ]),
        Type.Object({ z: Type.String() }),
      ]),
    }),
    {
      value: {
        x: "primitive",
        y: "primitive",
        z: "primitive",
      },
    },
  ],
  [
    Type.Object({
      x: Type.Intersect([
        Type.Union([
          Type.Object({
            connectionString: Type.String(),
          }),
          Type.Object({
            host: Type.String(),
            port: Type.Number(),
            database: Type.Optional(Type.String()),
            username: Type.Optional(Type.String()),
            password: Type.Optional(Type.String()),
          }),
        ]),
        Type.Object({
          connectionTimeoutMillis: Type.Number(),
        }),
      ]),
    }),
    {
      x: {
        connectionString: "primitive",
        host: "primitive",
        port: "primitive",
        database: "primitive",
        username: "primitive",
        password: "primitive",
        connectionTimeoutMillis: "primitive",
      },
    },
  ],
  [
    Type.Object({
      x: Type.Intersect([
        Type.Union([
          Type.Object({
            url: Type.String(),
          }),
          Type.Object({
            host: Type.String(),
            port: Type.Number(),
            db: Type.Optional(Type.String()),
            username: Type.Optional(Type.String()),
            password: Type.Optional(Type.String()),
          }),
        ]),
        Type.Union([
          Type.Object({
            connectTimeout: Type.Number(),
            commandTimeout: Type.Number(),
          }),
          Type.Object({
            timeout: Type.Number(),
          }),
        ]),
      ]),
    }),
    {
      x: {
        url: "primitive",
        host: "primitive",
        port: "primitive",
        db: "primitive",
        username: "primitive",
        password: "primitive",
        timeout: "primitive",
        connectTimeout: "primitive",
        commandTimeout: "primitive",
      },
    },
  ],
  [
    Type.Object({
      nodes: Type.Array(
        Type.Object({ host: Type.String(), port: Type.Number() }),
        {
          minItems: 1,
        }
      ),
      timeout: Type.Number(),
    }),
    {
      nodes: "json",
      timeout: "primitive",
    },
  ],
])("transforms Typebox schema %#", async (schema, expected) => {
  const result = schemaToObj(schema);

  expect(result).toEqual(expected);
});

test.each([
  Type.Object({
    value: Type.Intersect([Type.String(), Type.Number()]),
  }),
  Type.Object({
    value: Type.Intersect([Type.Array(Type.String()), Type.Number()]),
  }),
  Type.Object({
    value: Type.Intersect([
      Type.Array(Type.String()),
      Type.Record(Type.String(), Type.Unknown()),
    ]),
  }),
  Type.Object({
    value: Type.Intersect([
      Type.Object({ x: Type.String() }),
      Type.Object({ x: Type.Array(Type.String()) }),
    ]),
  }),
  Type.Object({
    value: Type.Intersect([
      Type.Union([Type.Object({ x: Type.String() })]),
      Type.Union([
        Type.Object({
          y: Type.String(),
          x: Type.Record(Type.String(), Type.Unknown()),
        }),
      ]),
    ]),
  }),
])("fails with untransformable Typebox schema %#", async (schema) => {
  expect(() => schemaToObj(schema)).toThrow();
});
