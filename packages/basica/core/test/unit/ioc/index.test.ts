import { IocContainer } from "src/ioc/index";
import { test, expect, vi, afterEach, beforeEach } from "vitest";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

test("addSingleton", async () => {
  const container = new IocContainer().addSingleton("test", () => "test");

  expect(container.services.test).toEqual("test");
});

test("addTransient", async () => {
  const container = new IocContainer().addTransient("test", () => new Date());

  const date1 = container.services.test();
  await vi.advanceTimersByTimeAsync(1000);
  const date2 = container.services.test();

  expect(date1).toBeInstanceOf(Date);
  expect(date2).toBeInstanceOf(Date);
  expect(date1).not.toEqual(date2);
});
