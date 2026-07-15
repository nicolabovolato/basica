import { envProvider, readEnv } from "src/env";
import { ConfigSchema } from "src/utils";
import { afterEach, expect, test, vi } from "vitest";
import { z } from "zod";

const opts = { interpolator: "_", casing: "upper" } as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

test("reads env", () => {
  const schema: ConfigSchema = {
    test: "string",
    nested: {
      test: "json",
      nested: {
        test: "json",
      },
    },
    json: "json",
  };

  vi.stubEnv("TEST", "test");
  vi.stubEnv("NESTED_TEST", '{"nested": "test"}');
  vi.stubEnv("NESTED_NESTED_TEST", '["nested","nested","test"]');
  vi.stubEnv("JSON", "not a valid json object/array");

  expect(readEnv(schema, opts)).toEqual({
    test: "test",
    nested: {
      test: { nested: "test" },
      nested: {
        test: ["nested", "nested", "test"],
      },
    },
    json: "not a valid json object/array",
  });
});

test("coerces scalars", () => {
  const schema: ConfigSchema = {
    str: "string",
    num: "number",
    int: "integer",
    boolTrue: "boolean",
    boolFalse: "boolean",
    boolOne: "boolean",
    boolZero: "boolean",
  };

  vi.stubEnv("STR", "1234");
  vi.stubEnv("NUM", "1.5");
  vi.stubEnv("INT", "42");
  vi.stubEnv("BOOLTRUE", "true");
  vi.stubEnv("BOOLFALSE", "false");
  vi.stubEnv("BOOLONE", "1");
  vi.stubEnv("BOOLZERO", "0");

  expect(readEnv(schema, opts)).toEqual({
    str: "1234",
    num: 1.5,
    int: 42,
    boolTrue: true,
    boolFalse: false,
    boolOne: true,
    boolZero: false,
  });
});

test("leaves unparseable scalars untouched for validation to report", () => {
  const schema: ConfigSchema = {
    num: "number",
    bool: "boolean",
  };

  vi.stubEnv("NUM", "not-a-number");
  vi.stubEnv("BOOL", "maybe");

  expect(readEnv(schema, opts)).toEqual({
    num: "not-a-number",
    bool: "maybe",
  });
});

test("reads unions with precedence to scalar/json", () => {
  const schema: ConfigSchema = {
    union1: ["string", { value: "string" }],
    union2: ["string", { value: "string" }],
    union3: ["string", { value: "json" }],
    union4: ["string", { value: "json" }],
    union5: ["json", { value: "string" }],
    union6: ["json", { value: "string" }],
    union7: ["json", { value: "json" }],
    union8: ["json", { value: "json" }],
  };

  vi.stubEnv("UNION1", "test");
  vi.stubEnv("UNION2_VALUE", "test");
  vi.stubEnv("UNION3", "test");
  vi.stubEnv("UNION4_VALUE", '{"test": "test"}');
  vi.stubEnv("UNION5", '{"test": "test"}');
  vi.stubEnv("UNION6_VALUE", "test");
  vi.stubEnv("UNION7", '{"test": "test"}');
  vi.stubEnv("UNION8_VALUE", '{"test": "test"}');

  expect(readEnv(schema, opts)).toEqual({
    union1: "test",
    union2: { value: "test" },
    union3: "test",
    union4: { value: { test: "test" } },
    union5: { test: "test" },
    union6: { value: "test" },
    union7: { test: "test" },
    union8: { value: { test: "test" } },
  });
});

test("reads deep nested unions", () => {
  const inner: ConfigSchema = {
    union1: ["string", { value: "string" }],
    union2: ["string", { value: "string" }],
  };
  const schema: ConfigSchema = {
    union1: [
      "string",
      { union1: ["string", inner], union2: ["string", inner] },
    ],
    union2: [
      "string",
      { union1: ["string", inner], union2: ["string", inner] },
    ],
  };

  vi.stubEnv("UNION1_UNION1_UNION1_VALUE", "test");
  vi.stubEnv("UNION1_UNION1_UNION2", "test");
  vi.stubEnv("UNION1_UNION2", "test");
  vi.stubEnv("UNION2", "test");

  expect(readEnv(schema, opts)).toEqual({
    union1: {
      union1: { union1: { value: "test" }, union2: "test" },
      union2: "test",
    },
    union2: "test",
  });
});

test("reads env (explicit interpolator)", () => {
  const schema: ConfigSchema = {
    test: "string",
    test_1: "json",
    test_2: {
      test: "string",
      test_1: "string",
      test_2: "json",
    },
    test_2_test: "string",
  };

  vi.stubEnv("TEST", "test");
  vi.stubEnv("TEST_1", '{ "test1": "test" }');
  vi.stubEnv("TEST_2_TEST", "test2test");
  vi.stubEnv("TEST_2+TEST", "test2test");
  vi.stubEnv("TEST_2+TEST_1", "test2test1");
  vi.stubEnv("TEST_2+TEST_2", '{ "test2": "test2" }');

  expect(readEnv(schema, { interpolator: "+", casing: "upper" })).toEqual({
    test: "test",
    test_1: { test1: "test" },
    test_2: {
      test: "test2test",
      test_1: "test2test1",
      test_2: { test2: "test2" },
    },
    test_2_test: "test2test",
  });
});

test("reads env (explicit casing)", () => {
  const schema: ConfigSchema = {
    test: "string",
    test_1: "json",
    test_2: {
      test: "string",
      test_1: "string",
      test_2: "json",
    },
    test_2_test: "string",
  };

  vi.stubEnv("test", "test");
  vi.stubEnv("test_1", '{ "test1": "test" }');
  vi.stubEnv("test_2_test", "test2test");
  vi.stubEnv("test_2_test_1", "test2test1");
  vi.stubEnv("test_2_test_2", '{ "test2": "test2" }');

  expect(readEnv(schema, { interpolator: "_", casing: "lower" })).toEqual({
    test: "test",
    test_1: { test1: "test" },
    test_2: {
      test: "test2test",
      test_1: "test2test1",
      test_2: { test2: "test2" },
    },
    test_2_test: "test2test",
  });
});

test("envProvider resolves a standard schema end to end", () => {
  const schema = z.object({
    port: z.number(),
    enabled: z.boolean(),
    db: z.union([
      z.object({ connectionString: z.string() }),
      z.object({ host: z.string(), port: z.number() }),
    ]),
    tags: z.array(z.string()),
  });

  vi.stubEnv("PORT", "8080");
  vi.stubEnv("ENABLED", "true");
  vi.stubEnv("DB_CONNECTIONSTRING", "postgres://localhost");
  vi.stubEnv("TAGS", '["a","b"]');

  const raw = envProvider().get(schema);

  expect(raw).toEqual({
    port: 8080,
    enabled: true,
    db: {
      connectionString: "postgres://localhost",
      host: undefined,
      port: undefined,
    },
    tags: ["a", "b"],
  });
  expect(schema.parse(raw)).toEqual({
    port: 8080,
    enabled: true,
    db: { connectionString: "postgres://localhost" },
    tags: ["a", "b"],
  });
});

test("reads literal unions and primitive unions from env", () => {
  const schema = z.object({
    // union of string literals, e.g. a logger level
    level: z.union([z.literal("fatal"), z.literal("error"), z.literal("info")]),
    // union of scalars: read as-is, the string branch matches
    id: z.union([z.string(), z.number()]),
  });

  vi.stubEnv("LEVEL", "info");
  vi.stubEnv("ID", "12345");

  const raw = envProvider().get(schema);

  expect(raw).toEqual({ level: "info", id: "12345" });
  expect(schema.parse(raw)).toEqual({ level: "info", id: "12345" });
});
