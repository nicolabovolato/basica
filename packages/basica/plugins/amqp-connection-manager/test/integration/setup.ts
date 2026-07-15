import { GenericContainer, StartedTestContainer, Wait } from "testcontainers";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    amqpUrl: string;
  }
}

export default async function setup(project: TestProject) {
  const container: StartedTestContainer = await new GenericContainer(
    "rabbitmq:4-alpine",
  )
    .withExposedPorts(5672)
    .withWaitStrategy(Wait.forLogMessage(/Server startup complete/))
    .start();

  project.provide(
    "amqpUrl",
    `amqp://${container.getHost()}:${container.getMappedPort(5672)}`,
  );

  return async () => {
    await container.stop();
  };
}
