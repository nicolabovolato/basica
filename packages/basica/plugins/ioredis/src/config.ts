import { Type, Static } from "@sinclair/typebox";
import { ClusterOptions, RedisOptions } from "ioredis";

const timeoutConfigSchema = Type.Union([
  Type.Object({
    connectTimeout: Type.Number(),
    commandTimeout: Type.Number(),
  }),
  Type.Object({
    /** connectTimeout and commandTimeout */
    timeout: Type.Number(),
  }),
]);

/** Redis wrapper configuration schema */
export const redisWrapperConfigSchema = Type.Intersect([
  Type.Union([
    Type.Object({
      /** @example "redis://user:pass@127.0.0.1:6379/2" */
      url: Type.String(),
    }),
    Type.Object({
      host: Type.String(),
      port: Type.Number(),
      db: Type.Optional(Type.String()),
      username: Type.Optional(Type.String()),
      password: Type.Optional(Type.String()),
    }),
  ]),
  timeoutConfigSchema,
]);

/** Redis cluster wrapper configuration schema */
export const clusterWrapperConfigSchema = Type.Intersect([
  Type.Object({
    nodes: Type.Array(
      Type.Object({ host: Type.String(), port: Type.Number() }),
      {
        minItems: 1,
      }
    ),
  }),
  timeoutConfigSchema,
]);

/** @see {@link RedisOptions} */
export type RedisWrapperConfig = RedisOptions &
  Static<typeof redisWrapperConfigSchema>;

/** @see {@link ClusterOptions} */
export type ClusterWrapperConfig = ClusterOptions &
  Static<typeof clusterWrapperConfigSchema>;

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
