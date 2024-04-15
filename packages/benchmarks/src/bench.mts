import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

import { pino } from "pino";

import { __dirname, packages } from "./config.mjs";
import { benchmark, buildContainerAndDeps } from "./utils.mjs";

const logger = pino();

for (const [_group, pkgs] of Object.entries(packages)) {
  const group = _group as keyof typeof packages;
  const groupLogger = logger.child({ group });
  groupLogger.info("Running bench for group " + group);

  for (const pkg of pkgs) {
    const pkgLogger = groupLogger.child({ pkg });
    const resultsDir = path.join(__dirname, "..", "results", group, pkg);

    await fs.mkdir(resultsDir, { recursive: true });

    const { container, deps } = await buildContainerAndDeps(
      group,
      pkg,
      pkgLogger
    );

    pkgLogger.info("Starting container and deps for package " + pkg);
    const startedDeps = await Promise.all(deps.map((dep) => dep.start()));
    const startedContainer = await container.start();

    const logs = await startedContainer.logs();
    const logFile = createWriteStream(path.join(resultsDir, "log"));
    logs.pipe(logFile);

    pkgLogger.info("Running bench for package " + pkg);
    const results = await benchmark(group, startedContainer, pkgLogger);

    logs.unpipe(logFile);
    logFile.end();

    pkgLogger.info("Stopping container and deps for package " + pkg);
    await startedContainer.stop();
    await Promise.all(startedDeps.map((dep) => dep.stop()));

    pkgLogger.info("Writing bench results for package " + pkg);

    await fs.writeFile(
      path.join(resultsDir, `results.json`),
      JSON.stringify(results)
    );
  }
}
