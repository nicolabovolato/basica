import { loggerFactory } from "@basica/core/logger";

import { StartedTestContainer } from "testcontainers";

import { AMQPClient } from "src/client";
import { AMQPClientConfig } from "src/config";

export const getAMQPClient = (container: StartedTestContainer) => {
  return new AMQPClient(
    {
      urls: `amqp://${container.getHost()}:${container.getMappedPort(5672)}`,
      heartbeatIntervalInSeconds: 2,
    },
    loggerFactory({ level: "silent" }),
    "test"
  );
};
