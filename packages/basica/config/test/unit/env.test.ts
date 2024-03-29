import { envProvider } from "src/env";
import { ConfigSchema } from "src/utils";
import { test, vi, expect, afterEach } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

test("parses env", async () => {
  const schema: ConfigSchema = {
    test: "primitive",
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

  const env = envProvider().get(schema);
  expect(env).toEqual({
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

test("parses unions env (precedence to json/primitive)", async () => {
  const schema: ConfigSchema = {
    union1: ["primitive", { value: "primitive" }],
    union2: ["primitive", { value: "primitive" }],
    union3: ["primitive", { value: "json" }],
    union4: ["primitive", { value: "json" }],
    union5: ["json", { value: "primitive" }],
    union6: ["json", { value: "primitive" }],
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

  const env = envProvider().get(schema);
  expect(env).toEqual({
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

test("deep nested unions", async () => {
  const schema: ConfigSchema = {
    union1: [
      "primitive",
      {
        union1: [
          "primitive",
          {
            union1: ["primitive", { value: "primitive" }],
            union2: ["primitive", { value: "primitive" }],
          },
        ],
        union2: [
          "primitive",
          {
            union1: ["primitive", { value: "primitive" }],
            union2: ["primitive", { value: "primitive" }],
          },
        ],
      },
    ],
    union2: [
      "primitive",
      {
        union1: [
          "primitive",
          {
            union1: ["primitive", { value: "primitive" }],
            union2: ["primitive", { value: "primitive" }],
          },
        ],
        union2: [
          "primitive",
          {
            union1: ["primitive", { value: "primitive" }],
            union2: ["primitive", { value: "primitive" }],
          },
        ],
      },
    ],
  };

  vi.stubEnv("UNION1_UNION1_UNION1_VALUE", "test");
  vi.stubEnv("UNION1_UNION1_UNION2", "test");
  vi.stubEnv("UNION1_UNION2", "test");
  vi.stubEnv("UNION2", "test");

  const env = envProvider().get(schema);
  expect(env).toEqual({
    union1: {
      union1: { union1: { value: "test" }, union2: "test" },
      union2: "test",
    },
    union2: "test",
  });
});

test("parses env (explicit interpolator)", async () => {
  const schema: ConfigSchema = {
    test: "primitive",
    test_1: "json",
    test_2: {
      test: "primitive",
      test_1: "primitive",
      test_2: "json",
    },
    test_2_test: "primitive",
  };

  vi.stubEnv("TEST", "test");
  vi.stubEnv("TEST_1", '{ "test1": "test" }');
  vi.stubEnv("TEST_2_TEST", "test2test");
  vi.stubEnv("TEST_2+TEST", "test2test");
  vi.stubEnv("TEST_2+TEST_1", "test2test1");
  vi.stubEnv("TEST_2+TEST_2", '{ "test2": "test2" }');

  const env = envProvider({
    interpolator: "+",
  }).get(schema);
  expect(env).toEqual({
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

test("parses env (explicit casing)", async () => {
  const schema: ConfigSchema = {
    test: "primitive",
    test_1: "json",
    test_2: {
      test: "primitive",
      test_1: "primitive",
      test_2: "json",
    },
    test_2_test: "primitive",
  };

  vi.stubEnv("test", "test");
  vi.stubEnv("test_1", '{ "test1": "test" }');
  vi.stubEnv("test_2_test", "test2test");
  vi.stubEnv("test_2_test_1", "test2test1");
  vi.stubEnv("test_2_test_2", '{ "test2": "test2" }');

  const env = envProvider({
    casing: "lower",
  }).get(schema);
  expect(env).toEqual({
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
