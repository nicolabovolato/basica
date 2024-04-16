import path from "node:path";

import autocannon from "autocannon";
import { randomUUID } from "crypto";
import { $, ExecaReturnValue } from "execa";
import hdr from "hdr-histogram-js";
import { Logger } from "pino";
import {
  GenericContainer,
  Network,
  StartedTestContainer,
} from "testcontainers";

import {
  __dirname,
  benchmarkConnections,
  benchmarkDuration,
  benchmarkPipelines,
  containerCpu,
  containerMemory,
  dockerfilePath,
  getStartupTimeTimeout,
  packages,
  rootDir,
  startupTimeLogRegex,
  statsRefreshInterval,
} from "./config.mjs";

export const buildContainerAndDeps = async (
  group: keyof typeof packages,
  pkg: string,
  logger: Logger
) => {
  const workspaceName = `bench-${group}-${pkg}`;
  const workspacePath = path.relative(
    rootDir,
    path.join(__dirname, "..", group, pkg)
  );

  logger.info(
    `Building dockerfile with workspace ${workspaceName} and path ${workspacePath}`
  );
  await $`docker build -t ${workspaceName} -f ${dockerfilePath} --build-arg WORKSPACE_NAME=${workspaceName} --build-arg WORKSPACE_PATH=${workspacePath} ${rootDir}`;
  const container = new GenericContainer(workspaceName);

  const deps = [] as GenericContainer[];
  if (group == "http") {
    container.withExposedPorts(8080);
  }
  if (group == "crud") {
    const network = await new Network().start();
    const pgName = `postgres-${randomUUID()}`;
    container
      .withExposedPorts(8080)
      .withEnvironment({
        DB_CONNECTIONSTRING: `postgres://postgres:postgres@${pgName}:5432`,
        DB_CONNECTIONTIMEOUTMILLIS: "5000",
      })
      .withNetwork(network);
    deps.push(
      new GenericContainer("postgres:15-alpine")
        .withName(pgName)
        .withEnvironment({
          POSTGRES_PASSWORD: "postgres",
        })
        .withNetwork(network)
        .withExposedPorts(5432)
    );
  }
  // if (group == "pubsub") {
  //   // TODO
  //   //deps.push(new GenericContainer("postgres").withExposedPorts(5432));
  // }

  return {
    container: container.withResourcesQuota({
      cpu: containerCpu,
      memory: containerMemory,
    }),
    deps,
  };
};

const startCollectingContainerUsage = (
  container: StartedTestContainer,
  logger: Logger
) => {
  let stopped = false;
  const results = {
    cpu: hdr.build({
      useWebAssembly: true,
      lowestDiscernibleValue: 1,
      highestTrackableValue: 100,
      numberOfSignificantValueDigits: 2,
    }),
    memory: hdr.build({
      useWebAssembly: true,
      lowestDiscernibleValue: 1,
      highestTrackableValue: 100,
      numberOfSignificantValueDigits: 2,
    }),
  };

  // dockerode crashes the process without a particular reason
  // const stats = await containerRuntimeClient.container.dockerode
  // .getContainer(container.getId())
  // .stats({ stream: false });
  const interval = setInterval(async () => {
    let cmd: ExecaReturnValue<string>;
    try {
      cmd =
        await $`docker stats --no-stream --format ${"{{json .}}"} ${container.getId()}`;
    } catch (err) {
      if (!stopped) throw err;
      return;
    }

    const stats = JSON.parse(cmd.stdout) as {
      MemPerc: string;
      CPUPerc: string;
    };

    const cpuPerc = Number(stats.CPUPerc.replace("%", ""));
    const memoryPerc = Number(stats.MemPerc.replace("%", ""));
    if (cpuPerc == 0 && memoryPerc == 0) {
      return;
    }

    results.cpu.recordValue(cpuPerc);
    results.memory.recordValue(memoryPerc);
  }, statsRefreshInterval);

  const stop = () => {
    stopped = true;
    clearInterval(interval);
    return {
      cpu: {
        min: results.cpu.minNonZeroValue,
        mean: results.cpu.mean,
        stddev: results.cpu.stdDeviation,
        ...results.cpu.summary,
      },
      memory: {
        min: results.memory.minNonZeroValue,
        mean: results.memory.mean,
        stddev: results.memory.stdDeviation,
        ...results.memory.summary,
      },
    };
  };

  return stop;
};

const getStartupTime = async (
  container: StartedTestContainer,
  logger: Logger
) => {
  // StartedTestContainer.logs() does not work (exits the program with no error)
  // Using for await of (also with Readable.toWeb()) exits the program with no error

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), getStartupTimeTimeout);

  const cmd = $({
    signal: ac.signal,
  })`docker logs ${container.getId()} --follow`;

  if (!cmd.stdout) {
    throw new Error("startup time cmd.stdout is undefined");
  }

  for await (const chunk of cmd.stdout) {
    const lines = chunk.toString("utf-8");
    for (const line of lines.split("\n")) {
      const match = line.match(startupTimeLogRegex);
      if (match) {
        clearTimeout(timeout);
        cmd.kill("SIGTERM");
        const time = Number(match[1]);
        logger.info("Got startup time: %dms", time);
        return time;
      }
    }
  }
};

export const benchmark = async (
  group: keyof typeof packages,
  container: StartedTestContainer,
  logger: Logger
) => {
  let autocannonResult = {};
  const startupTime = await getStartupTime(container, logger); // TODO: multiple runs to get startup time?
  const stopCollectingContainerUsage = startCollectingContainerUsage(
    container,
    logger
  );

  if (group == "http") {
    logger.info("Running autocannon");
    autocannonResult = await autocannon({
      url: `http://127.0.0.1:${container.getMappedPort(8080)}`,
      duration: benchmarkDuration,
      connections: benchmarkConnections,
      pipelining: benchmarkPipelines,
    });
  }

  if (group == "crud") {
    logger.info("Running autocannon");
    autocannonResult = await autocannon({
      url: `http://127.0.0.1:${container.getMappedPort(8080)}`,
      requests: [
        {
          method: "GET",
          path: "/todos",
        },
        {
          method: "POST",
          path: "/todos",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title: randomUUID(), description: null }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onResponse: (status: number, body: string, context: any) => {
            if (status === 201) {
              context.todo = JSON.parse(body);
            }
          },
        } as unknown as autocannon.Request,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: randomUUID(),
            description: randomUUID(),
            completed: true,
          }),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setupRequest: (request: any, context: any) =>
            context.todo && {
              ...request,
              path: `/todos/${context.todo.id}`,
            },
        } as unknown as autocannon.Request,
        {
          method: "GET",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setupRequest: (request: any, context: any) =>
            context.todo && {
              ...request,
              path: `/todos/${context.todo.id}`,
            },
        } as unknown as autocannon.Request,
        {
          method: "DELETE",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setupRequest: (request: any, context: any) =>
            context.todo && {
              ...request,
              path: `/todos/${context.todo.id}`,
            },
        } as unknown as autocannon.Request,
      ],
      duration: benchmarkDuration,
      connections: benchmarkConnections,
      pipelining: benchmarkPipelines,
    });
  }

  const containerResults = stopCollectingContainerUsage();

  return {
    autocannon: autocannonResult,
    container: containerResults,
    startupTime,
  };
};
