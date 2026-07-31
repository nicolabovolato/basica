import type { IApplication } from "@basica/core";
import closeWithGrace from "close-with-grace";

/**
 * Runs a basica app as a long-running Node process.
 *
 * Starts the lifecycle and shuts it down on a control signal or an
 * empty event loop.
 *
 * @example
 * import { AppBuilder } from "@basica/core";
 * import { run } from "@basica/platform-node";
 *
 * const app = AppBuilder.registerDependencies().build();
 *
 * run(app);
 */
export const run = async (app: IApplication) => {
  const logger = app.deps.logger.child({ name: "@basica:platform:node" });

  const { close } = closeWithGrace(
    { delay: app.lifecycle.config.shutdownTimeoutMs + 1000 },
    async ({ err, signal, manual }) => {
      if (err) {
        logger.fatal(err, "Caught error, shutting down...");
      } else if (signal) {
        logger.info({ signal }, `Received signal ${signal}, shutting down...`);
      } else if (manual) {
        logger.info("Received manual shutdown, shutting down...");
      }

      if (!(await app.lifecycle.stop())) {
        logger.info("Shutdown failed");
        process.exit(1);
      }
    },
  );

  if (!(await app.lifecycle.start())) {
    logger.info("Startup failed");
    process.exit(1);
  }

  process.on("beforeExit", () => {
    logger.info("Empty event loop, invoking shutdown...");
    close();
  });
};
