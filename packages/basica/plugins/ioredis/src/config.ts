import { ClusterOptions, RedisOptions } from "ioredis";
import { z } from "zod";

const timeoutConfigSchema = z.union([
  z.object({
    connectTimeout: z.number(),
    commandTimeout: z.number(),
  }),
  z.object({
    /** connectTimeout and commandTimeout */
    timeout: z.number(),
  }),
]);

/** Redis wrapper configuration schema */
export const redisWrapperConfigSchema = z.intersection(
  z.union([
    z.object({
      /** @example "redis://user:pass@127.0.0.1:6379/2" */
      url: z.string(),
    }),
    z.object({
      host: z.string(),
      port: z.number(),
      db: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
    }),
  ]),
  timeoutConfigSchema,
);

/** Redis cluster wrapper configuration schema */
export const clusterWrapperConfigSchema = z.intersection(
  z.object({
    nodes: z.array(z.object({ host: z.string(), port: z.number() })).min(1),
  }),
  timeoutConfigSchema,
);

/** @see {@link RedisOptions} */
export type RedisWrapperConfig = RedisOptions &
  z.infer<typeof redisWrapperConfigSchema>;

/** @see {@link ClusterOptions} */
export type ClusterWrapperConfig = ClusterOptions &
  z.infer<typeof clusterWrapperConfigSchema>;

export const getRedisConfig = (options: RedisWrapperConfig) => {
  const { url, timeout, ...cfg } = options as RedisWrapperConfig & {
    url?: string;
    timeout?: number;
  };
  const config = {
    connectTimeout: timeout,
    commandTimeout: timeout,
    reconnectOnError: () => true,
    lazyConnect: true,
    showFriendlyErrorStack: true,
    ...cfg,
  } satisfies RedisOptions;

  return { url, config } as { url?: string; config: RedisOptions };
};

export const getClusterConfig = (options: ClusterWrapperConfig) => {
  const { nodes, timeout, ...cfg } = options as ClusterWrapperConfig & {
    timeout?: number;
  };

  const config = {
    showFriendlyErrorStack: true,
    lazyConnect: true,
    redisOptions: getRedisConfig({
      timeout,
      ...cfg.redisOptions,
    } as RedisWrapperConfig).config,
    ...cfg,
  } satisfies ClusterOptions;

  return { nodes, config };
};
