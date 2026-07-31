import {
  EmptyContainerItems,
  IocContainer,
  UnknownContainerItems,
} from "src/ioc";
import { ILogger, loggerFactory } from "src/logger";
import {
  ILifecycleManager,
  LifecycleManager,
  LifecycleManagerBuilder,
  LifecycleManagerConfig,
} from "./lifecycle";

export type AppRequiredDeps = {
  logger: ILogger;
};

type ConfigureLifecycleReturn<
  CB,
  D extends AppRequiredDeps,
  H extends UnknownContainerItems,
  S extends UnknownContainerItems,
  E extends UnknownContainerItems,
> = CB extends (
  builder: LifecycleManagerBuilder<D, H, S, E>,
  services: D,
) => LifecycleManagerBuilder<D, infer H1, infer S1, infer E1>
  ? AppBuilder<D, H1, S1, E1>
  : never;

export class AppBuilder<
  D extends AppRequiredDeps,
  H extends UnknownContainerItems = EmptyContainerItems,
  S extends UnknownContainerItems = EmptyContainerItems,
  E extends UnknownContainerItems = EmptyContainerItems,
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
   * Registers the application's dependencies and returns the app builder.
   *
   * The container passed to `fn` is pre-seeded with a default `logger`, so
   * `deps.logger` is always available. Override it by registering your own
   * `"logger"`.
   * @param fn dependency registration function
   * @example
   * AppBuilder.registerDependencies((di) =>
   *   di.addSingleton("db", (deps) => new Db(deps.logger))
   * )
   */
  static registerDependencies<D extends AppRequiredDeps = AppRequiredDeps>(
    fn?: (di: IocContainer<AppRequiredDeps>) => IocContainer<D>,
  ) {
    const seed = new IocContainer().addSingleton("logger", () =>
      loggerFactory(),
    );
    return new AppBuilder((fn ? fn(seed) : seed) as IocContainer<D>);
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
      services: D,
    ) => LifecycleManagerBuilder<D, H, S, E>,
  >(fn: Fn): Pick<ConfigureLifecycleReturn<Fn, D, H, S, E>, "build">;
  configureLifecycle<
    Fn extends (
      builder: LifecycleManagerBuilder<D, H, S, E>,
      services: D,
    ) => LifecycleManagerBuilder<D, H, S, E>,
  >(
    cfg: LifecycleManagerConfig,
    fn: Fn,
  ): Pick<ConfigureLifecycleReturn<Fn, D, H, S, E>, "build">;
  configureLifecycle<
    Fn extends (
      builder: LifecycleManagerBuilder<D, H, S, E>,
      services: D,
    ) => LifecycleManagerBuilder<D, H, S, E>,
  >(configOrFn: LifecycleManagerConfig | Fn, maybeFn?: Fn) {
    const fn = typeof configOrFn === "object" ? maybeFn! : configOrFn;
    const config = typeof configOrFn === "object" ? configOrFn : undefined;

    const builder = fn(
      new LifecycleManagerBuilder<D, H, S, E>(this.#deps, config),
      this.#deps,
    );

    this.#healthchecks = builder.healthchecks;
    this.#services = builder.services;
    this.#entrypoints = builder.entrypoints;
    this.#lifecycle = builder.build();

    return this;
  }

  build() {
    return new Application(
      this.#deps,
      this.#healthchecks,
      this.#services,
      this.#entrypoints,
      this.#lifecycle,
    );
  }
}

/** A built Basica application */
export interface IApplication {
  readonly deps: AppRequiredDeps;
  readonly healthchecks: UnknownContainerItems;
  readonly services: UnknownContainerItems;
  readonly entrypoints: UnknownContainerItems;
  readonly lifecycle: ILifecycleManager;
}

export class Application<
  D extends AppRequiredDeps,
  H extends UnknownContainerItems,
  S extends UnknownContainerItems,
  E extends UnknownContainerItems,
> implements IApplication {
  constructor(
    readonly deps: D,
    readonly healthchecks: H,
    readonly services: S,
    readonly entrypoints: E,
    readonly lifecycle: ILifecycleManager,
  ) {}
}
