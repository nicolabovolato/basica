import { ILogger } from "src/logger";
import { IocContainer } from "src/ioc";
import {
  IHealthcheckManager,
  HealthcheckManager,
  HealthcheckManagerBuilder,
  HealthcheckManagerConfig,
} from "./healthcheck";
import {
  ILifecycleManager,
  LifecycleManager,
  LifecycleManagerBuilder,
  LifecycleManagerConfig,
} from "./lifecycle";
import closeWithGrace from "close-with-grace";

export type AppRequiredServices = {
  logger: ILogger;
};

export class AppBuilder<S extends AppRequiredServices> {
  #container: IocContainer<S>;
  #lifecycle: ILifecycleManager;
  #healthchecks: IHealthcheckManager;

  constructor(container: IocContainer<S>) {
    this.#container = container;
    this.#lifecycle = new LifecycleManager(
      this.#container.services.logger,
      [],
      []
    );
    this.#healthchecks = new HealthcheckManager(
      this.#container.services.logger,
      []
    );
  }

  configureHealthchecks(
    fn: (
      builder: HealthcheckManagerBuilder<S>,
      services: S
    ) => HealthcheckManagerBuilder<S>
  ): AppBuilder<S>;
  configureHealthchecks(
    cfg: HealthcheckManagerConfig,
    fn: (
      builder: HealthcheckManagerBuilder<S>,
      services: S
    ) => HealthcheckManagerBuilder<S>
  ): AppBuilder<S>;
  configureHealthchecks<
    Fn extends (
      builder: HealthcheckManagerBuilder<S>,
      services: S
    ) => HealthcheckManagerBuilder<S>,
  >(configOrFn: HealthcheckManagerConfig | Fn, maybeFn?: Fn) {
    const fn = typeof configOrFn === "object" ? maybeFn! : configOrFn;
    const config = typeof configOrFn === "object" ? configOrFn : undefined;

    const builder = new HealthcheckManagerBuilder<S>(
      this.#container.services,
      config
    );

    this.#healthchecks = fn(builder, this.#container.services).build();

    return this as Pick<AppBuilder<S>, "build">;
  }

  configureLifecycle(
    fn: (
      builder: LifecycleManagerBuilder<S>,
      services: S
    ) => LifecycleManagerBuilder<S>
  ): Pick<AppBuilder<S>, "build">;
  configureLifecycle(
    cfg: LifecycleManagerConfig,
    fn: (
      builder: LifecycleManagerBuilder<S>,
      services: S
    ) => LifecycleManagerBuilder<S>
  ): Pick<AppBuilder<S>, "build">;
  configureLifecycle<
    Fn extends (
      builder: LifecycleManagerBuilder<S>,
      services: S
    ) => LifecycleManagerBuilder<S>,
  >(configOrFn: LifecycleManagerConfig | Fn, maybeFn?: Fn) {
    const fn = typeof configOrFn === "object" ? maybeFn! : configOrFn;
    const config = typeof configOrFn === "object" ? configOrFn : undefined;

    const builder = new LifecycleManagerBuilder<S>(
      this.#container.services,
      this.#healthchecks,
      config
    );

    this.#lifecycle = fn(builder, this.#container.services).build();

    return this as Pick<AppBuilder<S>, "build">;
  }

  build() {
    return new App(this.#container.services.logger, this.#lifecycle);
  }
}

export class App {
  #logger: ILogger;
  #lifecycle: ILifecycleManager;

  constructor(logger: ILogger, lifecycle: ILifecycleManager) {
    this.#logger = logger.child({ name: "@basica:app" });
    this.#lifecycle = lifecycle;
  }

  async run(): Promise<void> {
    const { close } = closeWithGrace(
      { delay: this.#lifecycle.config.shutdownTimeoutMs + 1000 },
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

        if (!(await this.#lifecycle.stop())) {
          this.#logger.info("Shutdown failed");
          process.exit(1);
        }
      }
    );

    if (!(await this.#lifecycle.start())) {
      this.#logger.info("Startup failed");
      process.exit(1);
    }

    process.on("beforeExit", (_code) => {
      this.#logger.info("Empty event loop, invoking shutdown...");
      close();
    });
  }
}
