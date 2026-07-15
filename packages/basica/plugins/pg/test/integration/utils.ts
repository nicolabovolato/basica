import { loggerFactory } from "@basica/core/logger";

import { Client } from "src/client";
import { Pool } from "src/pool";

const logger = loggerFactory({ level: "silent" });

export const getClientInstance = (url: string) => {
  return new Client(
    {
      connectionString: url,
      connectionTimeoutMillis: 1000,
    },
    logger,
    "test",
  );
};

export const getPoolInstance = (url: string) => {
  return new Pool(
    {
      connectionString: url,
      connectionTimeoutMillis: 1000,
    },
    logger,
    "test",
  );
};
