import { ConfigProvider } from "@basica/config";

import { Config, getApp } from "../src/app";

const provider = (url?: string) =>
  ({
    get: () =>
      ({
        db: {
          connectionString: url ?? "postgres://localhost:5432",
          connectionTimeoutMillis: 1000,
        },
        logger: {
          level: "silent",
        },
      }) satisfies Config,
  }) satisfies ConfigProvider;

export const getTestApp = (url?: string) => getApp(provider(url));
