import { Attributes } from "@opentelemetry/api";
import { Resource, resourceFromAttributes } from "@opentelemetry/resources";
import { MetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { Instrumentation } from "@opentelemetry/instrumentation";
import { Sampler, SpanExporter } from "@opentelemetry/sdk-trace-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

// TODO: sdk-trace-base instead?
// TODO: serverless
/** Opentelemetry builder */
export class TelemetryBuilder {
  #resource: Resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.npm_package_name,
    [ATTR_SERVICE_VERSION]: process.env.npm_package_name_version,
  });

  #traceExporter: SpanExporter | undefined;
  #metricReader: MetricReader | undefined;
  #sampler: Sampler | undefined;
  #instrumentations: (Instrumentation | Instrumentation[])[] | undefined;

  /** Adds resource attributes */
  withAttributes(attributes: Attributes) {
    this.#resource = this.#resource.merge(resourceFromAttributes(attributes));
    return this;
  }

  /** Adds traces exporter */
  addTraceExporter(exporter: SpanExporter) {
    this.#traceExporter = exporter;
    return this;
  }

  /** Adds metrics exporter */
  addMetricReader(reader: MetricReader) {
    this.#metricReader = reader;
    return this;
  }

  /** Registers node instrumentations */
  registerInstrumentations(
    instrumentations: (Instrumentation | Instrumentation[])[]
  ) {
    this.#instrumentations = instrumentations;
    return this;
  }

  /** Adds trace sampling */
  withSampling(sampler: Sampler) {
    this.#sampler = sampler;
    return this;
  }

  build() {
    return new NodeSDK({
      resource: this.#resource,
      traceExporter: this.#traceExporter,
      metricReader: this.#metricReader,
      sampler: this.#sampler,
      instrumentations: this.#instrumentations,
    });
  }
}
