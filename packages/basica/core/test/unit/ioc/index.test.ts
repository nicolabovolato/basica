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
