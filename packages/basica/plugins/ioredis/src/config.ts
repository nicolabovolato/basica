import { Type, Static } from "@sinclair/typebox";
import { ClusterOptions, RedisOptions } from "ioredis";

export const redisWrapperConfigSchema = Type.Intersect([
  Type.Union([
    Type.Object({
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
  Type.Union([
    Type.Object({
      connectTimeout: Type.Number(),
      commandTimeout: Type.Number(),
    }),
    Type.Object({
      timeout: Type.Number(),
    }),
  ]),
]);

export const clusterWrapperConfigSchema = Type.Object({
  nodes: Type.Array(Type.Object({ host: Type.String(), port: Type.Number() }), {
    minItems: 1,
  }),
  timeout: Type.Number(),
});

export type RedisWrapperConfig = RedisOptions &
  Static<typeof redisWrapperConfigSchema>;

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
    lazyConnect: true,
    showFriendlyErrorStack: true,
    ...cfg,
  } satisfies RedisOptions;

  return { url, config } as { url?: string; config: RedisOptions };
};

export const getClusterConfig = (options: ClusterWrapperConfig) => {
  const { nodes, timeout, ...cfg } = options;

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
