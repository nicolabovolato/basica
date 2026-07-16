import { configure, envProvider } from "@basica/config";
import { TelemetryBuilder } from "@basica/telemetry";

import { z } from "zod";

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";
import { FetchInstrumentation } from "opentelemetry-instrumentation-fetch-node";

const config = configure(
  envProvider(),
  z.object({
    otlp: z
      .object({
        url: z.string().default("http://localhost:4317"),
      })
      .prefault({}),
    prometheus: z
      .object({
        host: z.string().default("localhost"),
        port: z.number().default(9464),
      })
      .prefault({}),
  })
);

const telemetry = new TelemetryBuilder()
  .addTraceExporter(new OTLPTraceExporter(config.otlp))
  .addMetricReader(new PrometheusExporter(config.prometheus))
  .registerInstrumentations([
    getNodeAutoInstrumentations(),
    new FetchInstrumentation({}),
  ])
  .build();

telemetry.start();
