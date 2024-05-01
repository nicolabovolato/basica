import { configure, envProvider } from "@basica/config";
import { AppBuilder } from "@basica/core";
import { IocContainer } from "@basica/core/ioc";
import { loggerConfigSchema, loggerFactory } from "@basica/core/logger";

import {
  fastifyConfigSchema,
  lifecyclePlugin as fastifyLifecyclePlugin,
} from "@basica/fastify";

import { Type } from "@sinclair/typebox";

import { routes } from "./routes";

const config = configure(
  envProvider(),
  Type.Object({
    logger: loggerConfigSchema,
    http: fastifyConfigSchema,
  })
);

const container = new IocContainer().addSingleton("logger", () =>
  loggerFactory(config.logger)
);

const app = new AppBuilder(container)
  .configureLifecycle((builder, deps) =>
    builder.with(fastifyLifecyclePlugin, (builder) =>
      builder.addFastifyEntrypoint("http", config.http, (builder) =>
        builder.configureApp((app) =>
          app.useOpenapi().fastify.register(routes(deps.logger))
        )
      )
    )
  )
  .build();

app.run();
