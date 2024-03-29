import { AppBuilder } from "@basica/core";
import { configure, envProvider } from "@basica/config";
import { IocContainer } from "@basica/core/ioc";
import { loggerConfigSchema, loggerFactory } from "@basica/core/logger";

import {
  fastifyConfigSchema,
  lifecyclePlugin as fastifyLifecyclePlugin,
} from "@basica/fastify";

import { Type } from "@sinclair/typebox";

import { routes } from "./routes";
import { Svc2 } from "./svc2";

const config = configure(
  envProvider(),
  Type.Object({
    logger: loggerConfigSchema,
    http: fastifyConfigSchema,
    svc2: Type.Object({
      url: Type.String(),
    }),
  })
);

const container = new IocContainer()
  .addSingleton("logger", () => loggerFactory(config.logger))
  .addSingleton("svc2", (services) => new Svc2(config.svc2, services.logger));

const app = new AppBuilder(container)
  .configureLifecycle((builder, services) =>
    builder.with(fastifyLifecyclePlugin, (builder) =>
      builder.addFastifyEntrypoint("http", config.http, (builder) =>
        builder.configureApp((app) =>
          app.useOpenapi().fastify.register(routes(services.svc2))
        )
      )
    )
  )
  .build();

app.run();
