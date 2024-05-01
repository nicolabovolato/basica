[![CI](https://github.com/nicolabovolato/basica/actions/workflows/ci.yml/badge.svg)](https://github.com/nicolabovolato/basica/actions/workflows/ci.yml)

# Basica

The Foundational Library of Modern Applications

## [Docs](https://basica.bovolato.dev)

`npm install @basica/core @basica/config @basica/fastify`

```ts
import { IocContainer } from "@basica/core/ioc";
import { loggerFactory } from "@basica/core/logger";
import { AppBuilder } from "@basica/core";
import { configure, envProvider } from "@basica/config";

import { lifecyclePlugin } from "@basica/fastify";

import { Type } from "@sinclair/typebox";

// Validate configuration
const config = configure(envProvider(), Type.Object({
  logger: loggerConfigSchema
}));

// Dependency injection
const container = new IocContainer()
  .addSingleton("logger", () => loggerFactory(config.logger))
  .addSingleton("svc", (s) => ({
    hello: () => {
      s.logger.info("svc called!");
      return "hello world";
    },
    healthcheck: () => ({ status: "healthy" }),
  }));

const app = new AppBuilder(container)
  // Lifecycle management
  .configureLifecycle((b, c) => b
    // Healthchecks
    .addHealthcheck("svc", (c) => c.svc)
    // Plugins
    .with(lifecyclePlugin, (b) => b
      .addFastifyEntrypoint("http", (f) => f
        .mapHealthchecks({ path: "/health" })
        .configureApp((app) => {
          app
            .useOpenapi()
            .fastify.get("/", () => c.svc.hello());
          }
        )
      )
    )
  ).build();

app.run();
```