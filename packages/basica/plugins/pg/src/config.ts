import { Type, Static } from "@sinclair/typebox";
import { ClientConfig as PGClientConfig, PoolConfig as PGPoolConfig } from "pg";

/** Postgres configuration schema */
export const pgConfigSchema = Type.Intersect([
  Type.Union([
    Type.Object({
      connectionString: Type.String(),
    }),
    Type.Object({
      host: Type.String(),
      port: Type.Number(),
      database: Type.Optional(Type.String()),
      username: Type.Optional(Type.String()),
      password: Type.Optional(Type.String()),
    }),
  ]),
  Type.Object({
    connectionTimeoutMillis: Type.Number(),
  }),
]);

export type ClientConfig = PGClientConfig & Static<typeof pgConfigSchema>;
export type PoolConfig = PGPoolConfig & Static<typeof pgConfigSchema>;

export const getClientConfig = (config: ClientConfig) => {
  return config as PGClientConfig;
};

export const getPoolConfig = (config: PoolConfig) =>
  getClientConfig(config) as PGClientConfig;
