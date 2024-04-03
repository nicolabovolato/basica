import { Static, Type } from "@sinclair/typebox";
import { abortable } from "src/utils";

import { AppRequiredServices } from ".";
import { Plugin } from "src/utils";
import { ILogger } from "src/logger";
import { tracer } from "src/utils/tracer";
import { SpanStatusCode } from "@opentelemetry/api";

/** Healthcheck result schema */
export const healthcheckResultSchema = Type.Union([
  Type.Object({
    status: Type.Literal("healthy"),
  }),
  Type.Object({
    status: Type.Literal("unhealthy"),
    /** User-facing error description */
    description: Type.Optional(Type.String()),
    /** Thrown error */
    error: Type.Optional(Type.Unknown()),
  }),
]);

export type HealthcheckResult = Static<typeof healthcheckResultSchema>;

export interface IHealthcheck {
  healthcheck(signal: AbortSignal): Promise<HealthcheckResult>;
}

/** healthcheck manager configuration */
export const healthcheckManagerConfigSchema = Type.Object({
  /**
   * timeout before an healthcheck is aborted
   * @default 5000
   */
  timeoutMs: Type.Number({ minimum: 0 }),
});

export type HealthcheckManagerConfig = Static<
  typeof healthcheckManagerConfigSchema
>;

/** Healthchecks manager */
export interface IHealthcheckManager {
  /**
   * Performs healthcheck
   * @param filter healthcheck filter function
   * @example
   * healthcheckManager.healthcheck((x) => x.contains("db")) // only services with name db will be run
   */
  healthcheck(
    filter?: (name: string) => boolean
  ): Promise<Record<string, HealthcheckResult>>;
}

export class HealthcheckManager implements IHealthcheckManager {
  readonly #items: Map<string, IHealthcheck> = new Map();
  readonly #config: HealthcheckManagerConfig;
  readonly #logger: ILogger;

  constructor(
    logger: ILogger,
    items: { name: string; value: IHealthcheck }[],
    config?: Partial<HealthcheckManagerConfig>
  ) {
    this.#logger = logger.child({ name: "@basica:app:healthcheck" });
    this.#config = { timeoutMs: 5000, ...(config ?? {}) };

    for (const item of items) {
      if (this.#items.has(item.name)) {
        this.#logger.warn(
          { healthcheck: item.name },
          `Duplicate healthcheck ${item.name}, will not be registered`
        );
      } else {
        this.#items.set(item.name, item.value);
      }
    }
  }

  async healthcheck(
    filter?: (name: string) => boolean
  ): Promise<Record<string, HealthcheckResult>> {
    return tracer.startActiveSpan(`healthcheck`, async (span) => {
      const ac = new AbortController();
      const acTimeout = setTimeout(() => ac.abort(), this.#config.timeoutMs);

      const healthchecks = Array.from(this.#items, ([key, value]) => ({
        name: key,
        value,
      })).filter((x) => (filter ? filter(x.name) : true));

      const result = await Promise.allSettled(
        healthchecks.map(async (h) =>
          tracer.startActiveSpan(`healthcheck:${h.name}`, async () => {
            try {
              return await abortable(
                ac.signal,
                async () => await h.value.healthcheck(ac.signal)
              );
            } catch (err) {
              span.recordException(err as Error);
              span.setStatus({ code: SpanStatusCode.ERROR });
              throw err;
            } finally {
              span.end();
            }
          })
        )
      );

      clearTimeout(acTimeout);

      for (const x of result) {
        if (x.status == "rejected") {
          span.recordException(x.reason);
        }
        if (x.status == "fulfilled" && x.value.status == "unhealthy") {
          span.setStatus({ code: SpanStatusCode.ERROR });
        }
      }

      const response = result
        .map<{ name: string; value: HealthcheckResult }>((res, idx) => ({
          name: healthchecks[idx].name,
          value:
            res.status == "fulfilled"
              ? res.value
              : { status: "unhealthy", error: res.reason },
        }))
        .reduce(
          function (r, e) {
            r[e.name] = e.value;
            return r;
          },
          {} as Record<string, HealthcheckResult>
        );

      span.end();
      return response;
    });
  }
}

export class HealthcheckManagerBuilder<S extends AppRequiredServices> {
  readonly #items: { name: string; value: IHealthcheck }[] = [];
  readonly #config: Partial<HealthcheckManagerConfig> | undefined;

  constructor(
    readonly services: S,
    config?: Partial<HealthcheckManagerConfig>
  ) {
    this.#config = config;
  }

  /**
   * Register a healthcheck
   * @example
   * builder.addHealthcheck("db", (services) => services.db)
   */
  addHealthcheck(name: string, fn: (services: S) => IHealthcheck) {
    this.#items.push({ name, value: fn(this.services) });
    return this;
  }

  /**
   * Use a plugin
   * @example
   * builder.with(myPlugin, (builder) => builder.newFunctionality())
   */
  with<B>(plugin: Plugin<this, B>, fn: (builder: B) => unknown) {
    fn(plugin(this));
    return this;
  }

  build() {
    return new HealthcheckManager(
      this.services.logger,
      this.#items,
      this.#config
    );
  }
}
