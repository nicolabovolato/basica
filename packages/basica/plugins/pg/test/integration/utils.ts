import { loggerFactory } from "@basica/core/logger";

import { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import { Client } from "src/client";
import { Pool } from "src/pool";

const logger = loggerFactory({ level: "silent" });

export const getClientInstance = (container: StartedPostgreSqlContainer) => {
  return new Client(
    {
      connectionString: container.getConnectionUri(),
      connectionTimeoutMillis: 1000,
    },
    logger,
    "test"
  );
};

export const getPoolInstance = (container: StartedPostgreSqlContainer) => {
  return new Pool(
    {
      connectionString: container.getConnectionUri(),
      connectionTimeoutMillis: 1000,
    },
    logger,
    "test"
  );
};
