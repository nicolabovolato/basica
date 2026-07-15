import { configure } from "src/index";
import { ConfigProvider } from "src/utils";
import { afterAll, expect, test, vi } from "vitest";
import { z } from "zod";

const fakeProvider = {
  get: vi.fn(),
} satisfies ConfigProvider;

afterAll(() => {
  vi.restoreAllMocks();
});

test("validates and returns the parsed config", () => {
  const schema = z.object({
    test: z.number(),
    nested: z.object({
      test: z.array(z.string()),
      nested: z.object({
        test: z.string(),
      }),
    }),
    union: z.union([z.object({ a: z.number() }), z.object({ b: z.number() })]),
    intersect: z.intersection(
      z.object({ a: z.number() }),
      z.object({ b: z.number() }),
    ),
  });

  const value = {
    test: 1,
    nested: {
      test: ["1"],
      nested: {
        test: "hello",
      },
    },
    union: {
      a: 1000,
    },
    intersect: {
      a: 1000,
      b: 1001,
    },
  };

  fakeProvider.get.mockReturnValue(value);

  expect(configure(fakeProvider, schema)).toEqual(value);
});

test("passes the schema to the provider", () => {
  const schema = z.object({ test: z.string() });
  fakeProvider.get.mockReturnValue({ test: "hello" });

  configure(fakeProvider, schema);

  expect(fakeProvider.get).toHaveBeenCalledWith(schema);
});

test("throws when the config does not match the schema", () => {
  const schema = z.object({
    test: z.number(),
    nested: z.object({
      test: z.array(z.string()),
    }),
  });

  fakeProvider.get.mockReturnValue({
    test: 1,
  });

  expect(() => configure(fakeProvider, schema)).toThrowError();
});
