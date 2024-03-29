import { setTimeout } from "node:timers/promises";
import { test, expect, vi, afterEach, beforeEach } from "vitest";
import { abortable } from "src/utils/abortable";

beforeEach(() => {
  //vi.useFakeTimers(); // TODO: timers/promises and AbortSignal are not mocked https://github.com/vitest-dev/vitest/issues/3088
});

afterEach(() => {
  //vi.useRealTimers();
});

test("aborts", async () => {
  const signal = AbortSignal.timeout(200);
  const promise = setTimeout(1000, "ok");

  const abortPromise = abortable(signal, () => promise);

  await expect(abortPromise).rejects.toMatchObject({ name: "TimeoutError" });
});

test("throws", async () => {
  const signal = AbortSignal.timeout(1000);
  const promise = setTimeout(200).then(() => {
    throw new Error("test error");
  });

  const abortPromise = abortable(signal, () => promise);

  await expect(abortPromise).rejects.toMatchObject({ message: "test error" });
});

test("resolves", async () => {
  const signal = AbortSignal.timeout(1000);
  const promise = setTimeout(200, "ok");

  const abortPromise = abortable(signal, () => promise);

  await expect(abortPromise).resolves.toEqual("ok");
});
