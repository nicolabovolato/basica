import type { IApplication } from "@basica/core";

/**
 * Runs a basica app as a long-running Deno process.
 *
 * Starts the lifecycle and shuts it down on a control signal or an unhandled rejection.
 *
 * Uses Deno's native signal handling (`Deno.addSignalListener`) rather than
 * close-with-grace, whose `process.on(signal)` path is not delivered through
 * Deno's Node compatibility layer.
 *
 * @example
 * import { AppBuilder } from "@basica/core";
 * import { run } from "@basica/platform-deno";
 *
 * const app = AppBuilder.registerDependencies().build()
 * run(app);
 */
export const run = async (app: IApplication) => {
  const logger = app.deps.logger.child({ name: "@basica:platform:deno" });

  let shuttingDown = false;
  const shutdown = async (reason: string, err?: unknown) => {
    if (shuttingDown) return;
    shuttingDown = true;

    if (err) {
      logger.fatal(err, reason);
    } else {
      logger.info(reason);
    }

    // hard-kill fallback if shutdown itself hangs (close-with-grace's `delay`)
    const kill = setTimeout(
      () => Deno.exit(1),
      app.lifecycle.config.shutdownTimeoutMs + 1000,
    );
    const stopped = await app.lifecycle.stop();
    clearTimeout(kill);

    if (!stopped) {
      logger.info("Shutdown failed");
      return Deno.exit(1);
    }
    return Deno.exit(0);
  };

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    Deno.addSignalListener(signal, () => {
      void shutdown(`Received ${signal}, shutting down...`);
    });
  }
  globalThis.addEventListener("unhandledrejection", (e) => {
    e.preventDefault();
    void shutdown("Caught error, shutting down...", e.reason);
  });

  if (!(await app.lifecycle.start())) {
    logger.info("Startup failed");
    return Deno.exit(1);
  }
};
