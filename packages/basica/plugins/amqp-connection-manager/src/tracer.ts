import { trace } from "@opentelemetry/api";

export const tracer = trace.getTracer("@basica/amqp-connection-manager");
