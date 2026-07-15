import { loggerFactory } from "@basica/core/logger";

import { Redis } from "ioredis";

import { ClusterWrapper } from "src/cluster";
import { ClusterWrapperConfig, RedisWrapperConfig } from "src/config";
import { RedisWrapper } from "src/redis";

export const getRedisWrapper = (url: string, cfg?: RedisWrapperConfig) => {
  return new RedisWrapper(
    { url, timeout: 1000, ...cfg },
    loggerFactory({ level: "silent" }),
    "test",
  );
};

export const getClusterWrapper = (
  cluster: Pick<ClusterWrapperConfig, "nodes" | "natMap">,
  cfg?: ClusterWrapperConfig,
) => {
  return new ClusterWrapper(
    {
      nodes: cluster.nodes,
      natMap: cluster.natMap,
      timeout: 3000,
      ...cfg,
    },
    loggerFactory({ level: "silent" }),
    "test",
  );
};

export const flushRedis = async (url: string) => {
  const redis = new Redis(url);
  await redis.flushall();
  redis.disconnect();
};

/** Flushes each cluster master directly (masters own all slots). */
export const flushCluster = async (
  cluster: Pick<ClusterWrapperConfig, "nodes">,
) => {
  await Promise.all(
    cluster.nodes.map(async ({ host, port }) => {
      const redis = new Redis({ host, port });
      await redis.flushall();
      redis.disconnect();
    }),
  );
};
