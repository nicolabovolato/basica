import { ConfigProvider, configure, envProvider } from "@basica/config";
import { AppBuilder } from "@basica/core";
import { IocContainer } from "@basica/core/ioc";
import { loggerConfigSchema, loggerFactory } from "@basica/core/logger";

import {
  Kysely,
  lifecyclePlugin as kyselyLifecyclePlugin,
} from "@basica/kysely";
import { pgConfigSchema } from "@basica/pg";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";

import { lifecyclePlugin as fastifyLifecyclePlugin } from "@basica/fastify";

import { Static, Type } from "@sinclair/typebox";

import { Database } from "./db";
import { routes } from "./routes";
import { ConflictError, NotFoundError, TodoService } from "./service";

export const configSchema = Type.Object({
  logger: loggerConfigSchema,
  db: pgConfigSchema,
});

export type Config = Static<typeof configSchema>;

export const getApp = (provider: ConfigProvider = envProvider()) => {
  const config = configure(provider, configSchema);

  const container = new IocContainer()
    .addSingleton("logger", () => loggerFactory(config.logger))
    .addSingleton(
      "db",
      (deps) =>
        new Kysely<Database>(
          {
            dialect: new PostgresDialect({
              pool: new Pool(config.db),
            }),
          },
          deps.logger
        )
    )
    .addSingleton("todos", (deps) => new TodoService(deps.db));

  return new AppBuilder(container)
    .configureLifecycle((builder, deps) =>
      builder
        .addService("db", () => deps.db)
        .with(kyselyLifecyclePlugin, (builder) =>
          builder.addKyselyMigrations(
            "migrations",
            deps.db,
            __dirname + "/../migrations"
          )
        )
        .with(fastifyLifecyclePlugin, (builder) =>
          builder.addFastifyEntrypoint("http", (builder) =>
            builder
              .configureApp((app) =>
                app
                  .useOpenapi()
                  .mapErrors((builder) =>
                    builder
                      .mapError(NotFoundError, 404)
                      .mapError(ConflictError, 409)
                  )
                  .fastify.register(routes(deps.todos))
              )
              .mapHealthchecks()
          )
        )
    )
    .build();
};
