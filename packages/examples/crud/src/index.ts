import { AppBuilder } from "@basica/core";
import { configure, envProvider } from "@basica/config";
import { IocContainer } from "@basica/core/ioc";
import { loggerConfigSchema, loggerFactory } from "@basica/core/logger";

import {
  Kysely,
  lifecyclePlugin as kyselyLifecyclePlugin,
} from "@basica/kysely";
import { PostgresDialect } from "kysely";
import { Pool } from "pg";
import { pgConfigSchema } from "@basica/pg";

import { lifecyclePlugin as fastifyLifecyclePlugin } from "@basica/fastify";

import { Type } from "@sinclair/typebox";

import { ConflictError, NotFoundError, TodoService } from "./service";
import { Database } from "./db";
import { routes } from "./routes";

const config = configure(
  envProvider(),
  Type.Object({
    logger: loggerConfigSchema,
    db: pgConfigSchema,
  })
);

const container = new IocContainer()
  .addSingleton("logger", () => loggerFactory(config.logger))
  .addSingleton(
    "db",
    (services) =>
      new Kysely<Database>(
        {
          dialect: new PostgresDialect({
            pool: new Pool(config.db),
          }),
        },
        services.logger
      )
  )
  .addSingleton("todos", (services) => new TodoService(services.db));

const app = new AppBuilder(container)
  .configureHealthchecks((builder) =>
    builder.addHealthcheck("db", (services) => services.db)
  )
  .configureLifecycle((builder, services) =>
    builder
      .addService("db", () => services.db)
      .with(kyselyLifecyclePlugin, (builder) =>
        builder.addKyselyMigrations(
          "migrations",
          services.db,
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
                .fastify.register(routes(services.todos))
            )
            .mapHealthchecks()
        )
      )
  )
  .build();

app.run();
