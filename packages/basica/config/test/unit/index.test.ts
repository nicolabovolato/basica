import { Type } from "@sinclair/typebox";
import { configure } from "src/index";
import { ConfigProvider } from "src/utils";
import { afterAll, test, vi, expect } from "vitest";

const fakeProvider = {
  get: vi.fn(),
} satisfies ConfigProvider;

afterAll(() => {
  vi.restoreAllMocks();
});

test("parses correctly", async () => {
  const schema = Type.Object({
    test: Type.Number(),
    nested: Type.Object({
      test: Type.Array(Type.String()),
      nested: Type.Object({
        test: Type.Date(),
      }),
    }),
  });

  const value = {
    test: 1,
    nested: {
      test: ["1"],
      nested: {
        test: new Date(1),
      },
    },
  };

  fakeProvider.get.mockReturnValue({
    test: 1,
    nested: {
      test: ["1"],
      nested: {
        test: new Date(1),
      },
    },
  });

  const result = configure(fakeProvider, schema);

  expect(result).toEqual(value);
});

test("parses correctly (coercion)", async () => {
  const schema = Type.Object({
    test: Type.Number(),
    test2: Type.Boolean(),
    nested: Type.Object({
      test: Type.Array(Type.String()),
      nested: Type.Object({
        test: Type.Date(),
      }),
    }),
    union: Type.Union([
      Type.Object({
        a: Type.Number(),
      }),
      Type.Object({
        b: Type.Number(),
      }),
    ]),
    intersect: Type.Intersect([
      Type.Object({
        a: Type.Number(),
      }),
      Type.Object({
        b: Type.Number(),
      }),
    ]),
    both: Type.Intersect([
      Type.Union([
        Type.Object({
          a: Type.Number(),
        }),
        Type.Object({
          b: Type.Number(),
        }),
      ]),
      Type.Object({
        c: Type.Number(),
      }),
    ]),
  });

  const value = {
    test: 1,
    test2: true,
    nested: {
      test: ["1"],
      nested: {
        test: new Date("2022-01-01T00:00:00.000Z"),
      },
    },
    intersect: {
      a: 1000,
      b: 1001,
    },
    union: {
      a: 1000,
    },
    both: {
      b: 1001,
      c: 1002,
    },
  };

  fakeProvider.get.mockReturnValue({
    test: "1",
    test2: "true",
    nested: {
      test: ["1"],
      nested: {
        test: "2022-01-01T00:00:00.000Z",
      },
    },
    intersect: {
      a: "1000",
      b: "1001",
    },
    union: {
      a: "1000",
    },
    both: {
      b: "1001",
      c: "1002",
    },
  });

  const result = configure(fakeProvider, schema);

  expect(result).toEqual(value);
});

test("fails", async () => {
  const schema = Type.Object({
    test: Type.Number(),
    nested: Type.Object({
      test: Type.Array(Type.String()),
      nested: Type.Object({
        test: Type.Date(),
      }),
    }),
  });

  fakeProvider.get.mockReturnValue({
    test: 1,
  });

  expect(() => configure(fakeProvider, schema)).toThrowError();
});
