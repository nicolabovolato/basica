import {
  IResource,
  Resource,
  ResourceAttributes,
} from "@opentelemetry/resources";
import { MetricReader } from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { InstrumentationOption } from "@opentelemetry/instrumentation";
import { Sampler, SpanExporter } from "@opentelemetry/sdk-trace-node";
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

// TODO: sdk-trace-base instead?
// TODO: serverless
/** Opentelemetry builder */
export class TelemetryBuilder {
  #resource: IResource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: process.env.npm_package_name,
    [SEMRESATTRS_SERVICE_VERSION]: process.env.npm_package_name_version,
  });

  #traceExporter: SpanExporter | undefined;
  #metricReader: MetricReader | undefined;
  #sampler: Sampler | undefined;
  #instrumentations: InstrumentationOption[] | undefined;

  /** Adds resource attributes */
  withAttributes(attributes: ResourceAttributes) {
    this.#resource = this.#resource.merge(new Resource(attributes));
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
  registerInstrumentations(instrumentations: InstrumentationOption[]) {
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
