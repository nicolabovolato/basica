import { RedisWrapperConfig, ClusterWrapperConfig } from "@basica/ioredis";

import { WorkerOptions } from "bullmq";
import { Cluster, Redis } from "ioredis";

export {
  RedisWrapperConfig,
  ClusterWrapperConfig,
  redisWrapperConfigSchema,
  clusterWrapperConfigSchema,
} from "@basica/ioredis";

export type WorkerConfig = WorkerOptions & {
  connection: RedisWrapperConfig | ClusterWrapperConfig | Redis | Cluster;
};

export const isClusterWrapperConfig = (
  cfg: RedisWrapperConfig | ClusterWrapperConfig
): cfg is ClusterWrapperConfig => {
  return (cfg as ClusterWrapperConfig).nodes !== undefined;
};
