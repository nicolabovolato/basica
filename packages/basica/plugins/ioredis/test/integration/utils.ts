import { loggerFactory } from "@basica/core/logger";

import { StartedRedisContainer } from "@testcontainers/redis";
import { StartedTestContainer } from "testcontainers";

import { ClusterWrapper } from "src/cluster";
import { RedisWrapper } from "src/redis";
import { ClusterWrapperConfig, RedisWrapperConfig } from "src/config";

export const getRedisWrapper = (
  container: StartedRedisContainer,
  cfg?: RedisWrapperConfig
) => {
  return new RedisWrapper(
    { url: container.getConnectionUrl(), timeout: 1000, ...cfg },
    loggerFactory({ level: "silent" }),
    "test"
  );
};

export const getClusterWrapper = (
  container: StartedTestContainer,
  cfg?: ClusterWrapperConfig
) => {
  return new ClusterWrapper(
    {
      nodes: [
        { host: container.getHost(), port: container.getMappedPort(30000) },
      ],
      timeout: 3000,
      ...cfg,
    },
    loggerFactory({ level: "silent" }),
    "test"
  );
};
