import { z } from "zod";

import { SpanStatusCode } from "@opentelemetry/api";

import { IocContainer } from "src/ioc";
import { ILogger } from "src/logger";
import { abortable } from "src/utils";
import { tracer } from "src/utils/tracer";

/** Healthcheck result schema */
export const healthcheckResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("healthy") }),
  z.object({
    status: z.literal("unhealthy"),
    /** User-facing error description */
    description: z.string().optional(),
    /** Thrown error */
    error: z.unknown().optional(),
  }),
]);

export type HealthcheckResult = z.infer<typeof healthcheckResultSchema>;

export interface IHealthcheck {
  healthcheck(signal: AbortSignal): Promise<HealthcheckResult>;
}

/** healthcheck manager configuration */
export const healthcheckManagerConfigSchema = z.object({
  /**
   * timeout before application healthcheck is aborted
   * @default 5000
   */
  healthcheckTimeoutMs: z.number().min(0),
});

export type HealthcheckManagerConfig = z.infer<
  typeof healthcheckManagerConfigSchema
>;

export type HealthcheckServices = Record<string, unknown>;

/** Healthchecks manager */
export interface IHealthcheckManager {
  /**
   * Performs healthcheck
   * @param filter healthcheck filter function
   * @example
   * healthcheckManager.healthcheck((x) => x == "db") // only healthchecks with name db will be run
   */
  healthcheck(
    filter?: (name: string) => boolean,
  ): Promise<Record<string, HealthcheckResult>>;
}

export class HealthcheckManager<
  H extends HealthcheckServices,
> implements IHealthcheckManager {
  readonly #builderItems = new IocContainer<H>();

  readonly #config: HealthcheckManagerConfig;
  readonly #logger: ILogger;

  constructor(logger: ILogger, config?: Partial<HealthcheckManagerConfig>) {
    this.#logger = logger.child({ name: "@basica:app:healthcheck" });
    this.#config = { healthcheckTimeoutMs: 5000, ...(config ?? {}) };
  }

  get healthchecks() {
    return this.#builderItems.items;
  }

  addHealthcheck<K extends string, V extends IHealthcheck>(name: K, value: V) {
    if (name in this.healthchecks) {
      this.#logger.warn(
        "Duplicate healthcheck name, previous value will be overwritten",
        { name },
      );
    }

    const svcs = this.#builderItems.addSingleton(name, () => value).items;
    return this as HealthcheckManager<typeof svcs>;
  }

  async healthcheck(
    filter?: (name: string) => boolean,
  ): Promise<Record<string, HealthcheckResult>> {
    return tracer.startActiveSpan(`healthcheck`, async (span) => {
      const ac = new AbortController();
      const acTimeout = setTimeout(
        () => ac.abort(),
        this.#config.healthcheckTimeoutMs,
      );

      const healthchecks = Array.from(
        Object.entries(this.healthchecks),
        ([key, value]) => ({
          name: key,
          value: value as IHealthcheck,
        }),
      ).filter((x) => (filter ? filter(x.name) : true));

      const result = await Promise.allSettled(
        healthchecks.map(async (h) =>
          tracer.startActiveSpan(`healthcheck:${h.name}`, async () => {
            try {
              return await abortable(
                ac.signal,
                async () => await h.value.healthcheck(ac.signal),
              );
            } catch (err) {
              span.recordException(err as Error);
              span.setStatus({ code: SpanStatusCode.ERROR });
              throw err;
            } finally {
              span.end();
            }
          }),
        ),
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
          {} as Record<string, HealthcheckResult>,
        );

      span.end();
      return response;
    });
  }
}
