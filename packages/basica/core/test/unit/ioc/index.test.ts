import { IocContainer } from "src/ioc/index";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

test("addSingleton", async () => {
  const container = new IocContainer().addSingleton("test", () => "test");

  expect(container.items.test).toEqual("test");
});

test("addTransient", async () => {
  const container = new IocContainer().addTransient("test", () => new Date());

  const date1 = container.items.test();
  await vi.advanceTimersByTimeAsync(1000);
  const date2 = container.items.test();

  expect(date1).toBeInstanceOf(Date);
  expect(date2).toBeInstanceOf(Date);
  expect(date1).not.toEqual(date2);
});

test("items is a frozen, isolated view of the container", () => {
  const container = new IocContainer().addSingleton("a", () => 1);

  const items = container.items;
  expect(items.a).toEqual(1);
  expect(Object.isFrozen(items)).toBe(true);

  // a holder (e.g. `app.deps`) can't mutate the container's map...
  expect(() => {
    (items as Record<string, unknown>).b = 2;
  }).toThrow();

  // ...and each read is an isolated snapshot, so internals stay intact
  expect(container.items).not.toBe(items);
  expect("b" in container.items).toBe(false);
});
