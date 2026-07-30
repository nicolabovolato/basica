import { configure, envProvider } from "@basica/config";
import { AppBuilder } from "@basica/core";
import { loggerConfigSchema, loggerFactory } from "@basica/core/logger";

import {
  fastifyConfigSchema,
  lifecyclePlugin as fastifyLifecyclePlugin,
} from "@basica/fastify";

import { z } from "zod";

import { routes } from "./routes";

const config = configure(
  envProvider(),
  z.object({
    logger: loggerConfigSchema,
    http: fastifyConfigSchema,
  }),
);

const app = AppBuilder.registerDependencies((di) =>
  di.addSingleton("logger", () => loggerFactory(config.logger)),
)
  .configureLifecycle((builder, deps) =>
    builder.with(fastifyLifecyclePlugin, (builder) =>
      builder.addFastifyEntrypoint("http", config.http, (builder) =>
        builder.configureApp((app) =>
          app.useOpenapi().fastify.register(routes(deps.logger)),
        ),
      ),
    ),
  )
  .build();

app.run();
