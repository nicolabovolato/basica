import { KafkaContainer, StartedKafkaContainer } from "@testcontainers/kafka";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    kafkaBroker: string;
  }
}

export default async function setup(project: TestProject) {
  const container: StartedKafkaContainer = await new KafkaContainer(
    "confluentinc/cp-kafka:8.0.0",
  )
    .withKraft()
    .withExposedPorts(9093)
    .start();

  project.provide(
    "kafkaBroker",
    `${container.getHost()}:${container.getMappedPort(9093)}`,
  );

  return async () => {
    await container.stop();
  };
}
