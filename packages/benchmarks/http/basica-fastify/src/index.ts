const time = process.hrtime();

import { AppBuilder } from "@basica/core";
import { IocContainer } from "@basica/core/ioc";
import { loggerFactory } from "@basica/core/logger";

import { lifecyclePlugin as fastifyLifecyclePlugin } from "@basica/fastify";

const container = new IocContainer().addSingleton("logger", () =>
  loggerFactory()
);

const app = new AppBuilder(container)
  .configureLifecycle((builder) =>
    builder.with(fastifyLifecyclePlugin, (builder) =>
      builder.addFastifyEntrypoint("http", (builder) =>
        builder.configureApp((app) => app.fastify.get("/", async () => {}))
      )
    )
  )
  .build();

app.run().then(() => {
  const diff = process.hrtime(time);
  const ms = (diff[0] * 1e9 + diff[1]) / 1e6;
  console.log(`STARTUP_TIME: ${ms}ms`);
});
