import { loggerFactory } from "@basica/core/logger";

import { AMQPClient } from "src/client";

export const getAMQPClient = (url: string) => {
  return new AMQPClient(
    {
      urls: url,
      heartbeatIntervalInSeconds: 2,
    },
    loggerFactory({ level: "silent" }),
    "test",
  );
};
