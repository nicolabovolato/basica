import closeWithGrace from "close-with-grace";
import { IocContainer } from "src/ioc";
import { ILogger } from "src/logger";
import { HealthcheckServices } from "./healthcheck";
import {
  ILifecycleManager,
  LifecycleEntrypoints,
  LifecycleManager,
  LifecycleManagerBuilder,
  LifecycleManagerConfig,
  LifecycleServices,
} from "./lifecycle";

export type AppRequiredDeps = {
  logger: ILogger;
};

type ConfigureLifecycleReturn<
  CB,
  D extends AppRequiredDeps,
  H extends HealthcheckServices,
  S extends LifecycleServices,
  E extends LifecycleEntrypoints,
> = CB extends (
  builder: LifecycleManagerBuilder<D, H, S, E>,
  services: D
) => LifecycleManagerBuilder<D, infer H1, infer S1, infer E1>
  ? AppBuilder<D, H1, S1, E1>
  : never;

export class AppBuilder<
  D extends AppRequiredDeps,
  H extends HealthcheckServices,
  S extends LifecycleServices,
  E extends LifecycleEntrypoints,
> {
  #deps: D;
  #services: S;
  #entrypoints: E;
  #healthchecks: H;
  #lifecycle: ILifecycleManager;

  constructor(deps: IocContainer<D>) {
    this.#deps = deps.items;
    this.#lifecycle = new LifecycleManager(this.#deps.logger, [], []);
    this.#healthchecks = {} as H;
    this.#services = {} as S;
    this.#entrypoints = {} as E;
  }

  /**
   * Configure application lifecycle
   * @see {@link LifecycleManagerBuilder}
   * @param fn builder function
   * @param cfg lifecycle manager {@link LifecycleManagerConfig config}
   * @example
   * builder.configureLifecycle((builder, deps) =>
   *   builder.addHealthcheck("upstream-service", deps.upstreamService)
   *          .addService("db", deps.db)
   *          .addEntrypoint("http", deps.http)
   * )
   * @example
   * builder.configureLifecycle({ startupTimeoutMs: 5000, shutdownTimeoutMs: 10000, healthcheckTimeoutMs: 1000 }, (builder, deps) =>
   *   builder.addHealthcheck("upstream-service", deps.upstreamService)
   *          .addService("db", deps.db)
   *          .addEntrypoint("http", deps.http)
   * )
   */
  configureLifecycle<
    Fn extends (
      builder: LifecycleManagerBuilder<D, H, S, E>,
      services: D
    ) => LifecycleManagerBuilder<D, H, S, E>,
  >(fn: Fn): Pick<ConfigureLifecycleReturn<Fn, D, H, S, E>, "build">;
  configureLifecycle<
    Fn extends (
      builder: LifecycleManagerBuilder<D, H, S, E>,
      services: D
    ) => LifecycleManagerBuilder<D, H, S, E>,
  >(
    cfg: LifecycleManagerConfig,
    fn: Fn
  ): Pick<ConfigureLifecycleReturn<Fn, D, H, S, E>, "build">;
  configureLifecycle<
    Fn extends (
      builder: LifecycleManagerBuilder<D, H, S, E>,
      services: D
    ) => LifecycleManagerBuilder<D, H, S, E>,
  >(configOrFn: LifecycleManagerConfig | Fn, maybeFn?: Fn) {
    const fn = typeof configOrFn === "object" ? maybeFn! : configOrFn;
    const config = typeof configOrFn === "object" ? configOrFn : undefined;

    const builder = fn(
      new LifecycleManagerBuilder<D, H, S, E>(this.#deps, config),
      this.#deps
    );

    this.#healthchecks = builder.healthchecks.healthchecks;
    this.#services = builder.services;
    this.#entrypoints = builder.entrypoints;
    this.#lifecycle = builder.build();

    return this;
  }

  build() {
    return new App(
      this.#deps,
      this.#healthchecks,
      this.#services,
      this.#entrypoints,
      this.#lifecycle
    );
  }
}

export class App<
  D extends AppRequiredDeps,
  H extends HealthcheckServices,
  S extends LifecycleServices,
  E extends LifecycleEntrypoints,
> {
  #logger: ILogger;

  constructor(
    readonly deps: D,
    readonly healthchecks: H,
    readonly services: S,
    readonly entrypoints: E,
    readonly lifecycle: ILifecycleManager
  ) {
    this.#logger = deps.logger.child({ name: "@basica:app" });
  }

  /** Start the application */
  async run(): Promise<void> {
    const { close } = closeWithGrace(
      { delay: this.lifecycle.config.shutdownTimeoutMs + 1000 },
      async ({ err, signal, manual }) => {
        if (err) {
          this.#logger.fatal(err, "Caught error, shutting down...");
        } else if (signal) {
          this.#logger.info(
            { signal },
            `Received signal ${signal}, shutting down...`
          );
        } else if (manual) {
          this.#logger.info("Received manual shutdown, shutting down...");
        }

        if (!(await this.lifecycle.stop())) {
          this.#logger.info("Shutdown failed");
          process.exit(1);
        }
      }
    );

    if (!(await this.lifecycle.start())) {
      this.#logger.info("Startup failed");
      process.exit(1);
    }

    process.on("beforeExit", (_code) => {
      this.#logger.info("Empty event loop, invoking shutdown...");
      close();
    });
  }
}
