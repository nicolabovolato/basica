import { z } from "zod";

export const AMQPClientConfigSchema = z.object({
  urls: z.union([z.string(), z.array(z.string())]),
  /** The same value will be used on service startup and as publishTimeout on every created channel */
  heartbeatIntervalInSeconds: z.number(),
});

export type AMQPClientConfig = z.infer<typeof AMQPClientConfigSchema>;
