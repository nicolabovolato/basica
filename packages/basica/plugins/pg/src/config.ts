import {
  type ClientConfig as PGClientConfig,
  type PoolConfig as PGPoolConfig,
} from "pg";
import { z } from "zod";

/** Postgres configuration schema */
export const pgConfigSchema = z.intersection(
  z.union([
    z.object({
      connectionString: z.string(),
    }),
    z.object({
      host: z.string(),
      port: z.number(),
      database: z.string().optional(),
      username: z.string().optional(),
      password: z.string().optional(),
    }),
  ]),
  z.object({
    connectionTimeoutMillis: z.number(),
  })
);

export type ClientConfig = PGClientConfig & z.infer<typeof pgConfigSchema>;
export type PoolConfig = PGPoolConfig & z.infer<typeof pgConfigSchema>;

export const getClientConfig = (config: ClientConfig) => {
  return config as PGClientConfig;
};

export const getPoolConfig = (config: PoolConfig) =>
  getClientConfig(config) as PGClientConfig;
