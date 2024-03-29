import { findWorkspaceDir } from "@pnpm/find-workspace-dir";
import path from "path";
import { pino } from "pino";
import { fileURLToPath } from "url";

export const packages = {
  http: ["basica-fastify", "fastify", "nestjs", "nestjs-fastify"],
  crud: ["basica-fastify", "fastify", "nestjs", "nestjs-fastify"],
} as const;

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const logger = pino();

export const benchmarkDuration = Number(process.env.BENCHMARK_DURATION) || 40;
export const benchmarkConnections =
  Number(process.env.BENCHMARK_CONNECTIONS) || 100;
export const benchmarkPipelines = Number(process.env.BENCHMARK_PIPELINES) || 10;

export const containerCpu = Number(process.env.CONTAINER_CPU) || 4;
export const containerMemory = Number(process.env.CONTAINER_MEMORY) || 4;
export const statsRefreshInterval =
  Number(process.env.STATS_REFRESH_INTERVAL) || 100;

export const startupTimeLogRegex = /^STARTUP_TIME: ([\d.]+)ms/;
export const getStartupTimeTimeout = 5000;

export const rootDir = await (async () => {
  const dir = await findWorkspaceDir(__dirname);
  if (!dir) {
    throw new Error("Could not find workspace directory");
  }
  return dir;
})();
export const dockerfilePath = path.join(__dirname, "Dockerfile");
