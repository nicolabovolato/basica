import { ConfigProvider } from "@basica/config";
import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import { Config, getApp } from "../src/app";

const provider = (container?: StartedPostgreSqlContainer) =>
  ({
    get: () =>
      ({
        db: {
          connectionString: container
            ? container.getConnectionUri()
            : "postgres://localhost:5432",
          connectionTimeoutMillis: 1000,
        },
        logger: {
          level: "silent",
        },
      }) satisfies Config,
  }) satisfies ConfigProvider;

export const getTestApp = (container?: StartedPostgreSqlContainer) =>
  getApp(provider(container));
