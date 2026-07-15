import { RedisContainer, StartedRedisContainer } from "@testcontainers/redis";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    redisUrl: string;
  }
}

export default async function setup(project: TestProject) {
  const container: StartedRedisContainer = await new RedisContainer(
    "redis:8-alpine",
  ).start();

  project.provide("redisUrl", container.getConnectionUrl());

  return async () => {
    await container.stop();
  };
}
