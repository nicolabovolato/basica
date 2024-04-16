import { Static, Type } from "@sinclair/typebox";

export const AMQPClientConfigSchema = Type.Intersect([
  Type.Object({
    urls: Type.Union([Type.String(), Type.Array(Type.String())]),
    /** The same value will be used on service startup and as publishTimeout on every created channel */
    heartbeatIntervalInSeconds: Type.Number(),
  }),
]);

export type AMQPClientConfig = Static<typeof AMQPClientConfigSchema>;
