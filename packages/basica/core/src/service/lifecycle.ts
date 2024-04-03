import { Static, Type } from "@sinclair/typebox";

import { AppRequiredServices } from ".";
import { IHealthcheckManager } from "./healthcheck";
import { ILogger } from "src/logger";
import { abortable, Plugin } from "src/utils";
import { tracer } from "src/utils/tracer";
import { SpanStatusCode } from "@opentelemetry/api";

export interface IShutdown {
  shutdown(signal: AbortSignal): Promise<void>;
}

export interface IStartup {
  start(signal: AbortSignal): Promise<void>;
}

export interface IEntrypoint extends IStartup, IShutdown {}

/** lifecycle manager configuration */
export const lifecycleManagerConfigSchema = Type.Object({
  /**
   * timeout before application startup is aborted
   * @default 5000
   */
  startupTimeoutMs: Type.Number({ minimum: 0 }),
  /**
   * timeout before application shutdown is aborted
   * @default 5000
   */
  shutdownTimeoutMs: Type.Number({ minimum: 0 }),
});

export type LifecycleManagerConfig = Static<
  typeof lifecycleManagerConfigSchema
>;

/** Lifecycle manager */
export interface ILifecycleManager {
  config: LifecycleManagerConfig;
  /** Start the application */
  start(): Promise<boolean>;
  /** Start the application */
  stop(): Promise<boolean>;
}

type Item<T = IEntrypoint | IStartup | IShutdown> = {
  name: string;
  svc: T;
};

type CollectionEntry = { items: Item[]; name: string };

// TODO: DAG on startup/shutdown?
export class LifecycleManager implements ILifecycleManager {
  readonly config: LifecycleManagerConfig;
  readonly #logger: ILogger;
  readonly #collection: CollectionEntry[] = [];

  constructor(
    logger: ILogger,
    services: Item[],
    entrypoints: Item[],
    config?: Partial<LifecycleManagerConfig>
  ) {
    this.#logger = logger.child({ name: "@basica:app:lifecycle" });
    this.config = {
      startupTimeoutMs: 5000,
      shutdownTimeoutMs: 5000,
      ...(config ?? {}),
    };

    this.#collection.push({ items: services, name: "service" });
    this.#collection.push({ items: entrypoints, name: "entrypoint" });

    this.#validateItems();
  }

  #validateItems() {
    for (const x of this.#collection) {
      const names = new Set();
      for (const item of x.items) {
        if (names.has(item.name)) {
          this.#logger.warn(
            { [x.name]: item.name },
            `Duplicate ${x.name} name: ${item.name}`
          );
        }
        names.add(item.name);
      }
    }
  }

  // TODO: it is not clear that among n services only some of them have "start", so starting 1/1 service(s) when you register 2 services is confusing
  async #start(items: Item[], name: string) {
    return tracer.startActiveSpan(`start:${name}`, async (span) => {
      const ac = new AbortController();
      const acTimeout = setTimeout(
        () => ac.abort(),
        this.config.shutdownTimeoutMs
      );

      const startups = items.filter(
        (i) => "start" in i.svc
      ) as Item<IStartup>[];

      this.#logger.info(
        `Starting ${startups.length}/${startups.length} ${name}(s)`
      );
      const result = await Promise.allSettled(
        startups.map(async (s) =>
          tracer.startActiveSpan(`start:${name}:${s.name}`, async () => {
            try {
              return await abortable(
                ac.signal,
                async () => await s.svc.start(ac.signal)
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

      const failed = result.filter(
        (res): res is PromiseRejectedResult => res.status == "rejected"
      );

      this.#logger.info(
        `Started ${startups.length - failed.length}/${startups.length} ${name}(s)`
      );

      if (failed.length > 0) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Failed to start ${failed.length} ${name}(s)`,
        });

        const failedNames = startups
          .map((s) => s.name)
          .filter((_, idx) => result[idx].status == "rejected");

        failed.forEach((f, idx) => {
          span.recordException(f.reason);
          this.#logger.error(f.reason, `Failed to start '${failedNames[idx]}'`);
        });

        const startedItems = startups.filter(
          (i) => !failedNames.includes(i.name)
        );
        const timedoutItems = startups.filter(
          (_, idx) =>
            result[idx].status == "rejected" &&
            (result[idx] as PromiseRejectedResult).reason instanceof
              DOMException &&
            (result[idx] as PromiseRejectedResult).reason.name == "AbortError"
        );

        span.end();
        return {
          success: false as const,
          started: [...startedItems, ...timedoutItems],
        };
      }

      span.end();
      return { success: true as const };
    });
  }

  async start() {
    return tracer.startActiveSpan(`start`, async (span) => {
      for (const [idx, x] of this.#collection.entries()) {
        if (x.items.length > 0) {
          const result = await this.#start(x.items, x.name);
          if (!result.success) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
            });

            const toStop = [
              ...result.started,
              ...x.items.filter((i) => !("start" in i.svc)),
            ];
            await this.#stopDownwards(idx, toStop);

            span.end();
            return false;
          }
        }
      }

      span.end();
      return true;
    });
  }

  // TODO: it is not clear that among n services only some of them have "stop", so stopping 1/1 service(s) when you register 2 services is confusing
  async #stop(toStop: Item[], total: Item[], name: string) {
    return tracer.startActiveSpan(`stop:${name}`, async (span) => {
      const ac = new AbortController();
      const acTimeout = setTimeout(
        () => ac.abort(),
        this.config.shutdownTimeoutMs
      );

      const totalShutdowns = total.filter((i) => "shutdown" in i.svc).length;

      const shutdowns = toStop.filter(
        (i) => "shutdown" in i.svc
      ) as Item<IShutdown>[];

      this.#logger.info(
        `Stopping ${shutdowns.length}/${totalShutdowns} ${name}(s)`
      );

      const result = await Promise.allSettled(
        shutdowns.map(async (s) =>
          tracer.startActiveSpan(`stop:${name}:${s.name}`, async () => {
            try {
              return await abortable(
                ac.signal,
                async () => await s.svc.shutdown(ac.signal)
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

      const failed = result.filter(
        (res): res is PromiseRejectedResult => res.status == "rejected"
      );

      this.#logger.info(
        `Stopped ${shutdowns.length}/${totalShutdowns} ${name}(s)`
      );

      if (failed.length > 0) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Failed to start ${failed.length} ${name}(s)`,
        });

        const failedNames = shutdowns
          .map((s) => s.name)
          .filter((_, idx) => result[idx].status == "rejected");

        failed.forEach((f, idx) => {
          span.recordException(f.reason);
          this.#logger.error(f.reason, `Failed to stop '${failedNames[idx]}'`);
        });

        span.end();
        return false;
      }

      span.end();
      return true;
    });
  }

  async #stopDownwards(
    idx: number = this.#collection.length - 1,
    onlyStopItems?: Item[]
  ) {
    return tracer.startActiveSpan(`stop`, async (span) => {
      const reversed = this.#collection.slice(0, idx + 1).reverse();
      let success = true;

      for (const [idx, x] of reversed.entries()) {
        const toStop =
          idx == reversed.length - 1 ? onlyStopItems ?? x.items : x.items;
        if (toStop.length > 0) {
          success &&= await this.#stop(toStop, x.items, x.name);
        } else {
          this.#logger.info(`No ${x.name}(s) to stop`);
        }
      }
      if (!success) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
        });
      }
      span.end();

      return success;
    });
  }

  async stop() {
    return await this.#stopDownwards();
  }
}

export class LifecycleManagerBuilder<S extends AppRequiredServices> {
  readonly #svcs: Item[] = [];
  readonly #entrypoints: Item[] = [];
  readonly #config: Partial<LifecycleManagerConfig> | undefined;

  constructor(
    readonly services: S,
    readonly healthchecks: IHealthcheckManager,
    config?: Partial<LifecycleManagerConfig>
  ) {
    this.#config = config;
  }

  /**
   * Registers a service in the application lifecycle
   * @example
   * builder.addService("db", (services) => services.db)
   */
  addService(
    name: string,
    fn: (services: S) => IStartup | IShutdown | (IStartup & IShutdown)
  ) {
    const svc = fn(this.services);
    this.#svcs.push({ name, svc });
    return this;
  }

  /**
   * Registers an entrypoint in the application lifecycle
   * @example
   * builder.addEntrypoint("db", (services) => services.db)
   */
  addEntrypoint(
    name: string,
    fn: (services: S, healthchecks: IHealthcheckManager) => IEntrypoint
  ) {
    const entrypoint = fn(this.services, this.healthchecks);
    this.#entrypoints.push({
      name,
      svc: entrypoint,
    });
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
    return new LifecycleManager(
      this.services.logger,
      this.#svcs,
      this.#entrypoints,
      this.#config
    );
  }
}
