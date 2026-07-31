import { configure, envProvider } from "@basica/config";
import { AppBuilder } from "@basica/core";
import { loggerConfigSchema, loggerFactory } from "@basica/core/logger";
import { run } from "@basica/platform-node";

import {
  fastifyConfigSchema,
  lifecyclePlugin as fastifyLifecyclePlugin,
} from "@basica/fastify";

import { z } from "zod";

import { routes } from "./routes";
import { Svc2 } from "./svc2";

const config = configure(
  envProvider(),
  z.object({
    logger: loggerConfigSchema,
    http: fastifyConfigSchema,
    svc2: z.object({
      url: z.string(),
    }),
  }),
);

const app = AppBuilder.registerDependencies((di) =>
  di
    .addSingleton("logger", () => loggerFactory(config.logger))
    .addSingleton("svc2", (deps) => new Svc2(config.svc2, deps.logger)),
)
  .configureLifecycle((builder, deps) =>
    builder.with(fastifyLifecyclePlugin, (builder) =>
      builder.addFastifyEntrypoint("http", config.http, (builder) =>
        builder.configureApp((app) =>
          app.useOpenapi().fastify.register(routes(deps.svc2)),
        ),
      ),
    ),
  )
  .build();

run(app);
