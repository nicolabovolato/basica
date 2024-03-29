import { configure, envProvider } from "@basica/config";
import { TelemetryBuilder } from "@basica/telemetry";

import { Type } from "@sinclair/typebox";

import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { PrometheusExporter } from "@opentelemetry/exporter-prometheus";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc";

const config = configure(
  envProvider(),
  Type.Object({
    otlp: Type.Object(
      {
        url: Type.String({ default: "http://localhost:4317" }),
      },
      { default: {} }
    ),
    prometheus: Type.Object(
      {
        host: Type.String({ default: "localhost" }),
        port: Type.Number({ default: 9464 }),
      },
      { default: {} }
    ),
  })
);

const telemetry = new TelemetryBuilder()
  .addTraceExporter(new OTLPTraceExporter(config.otlp))
  .addMetricReader(new PrometheusExporter(config.prometheus))
  .registerInstrumentations([getNodeAutoInstrumentations()])
  .build();

telemetry.start();
