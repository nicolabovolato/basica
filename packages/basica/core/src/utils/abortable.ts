/**
 * Executes a function and throws an error if the abort signal is triggered before its end
 * @throws DOMException
 */
export const abortable = <T>(signal: AbortSignal, fn: () => Promise<T>) => {
  const timeout = new Promise((_, reject) => {
    if (signal.aborted) reject(signal.reason);
    signal.addEventListener("abort", () => reject(signal.reason), {
      once: true,
    });
  });

  return Promise.race([fn(), timeout]) as Promise<T>;
};
