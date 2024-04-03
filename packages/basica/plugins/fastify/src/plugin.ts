import { AppRequiredServices, LifecycleManagerBuilder } from "@basica/core";
import { Plugin } from "@basica/core/utils";

import { FastifyConfig } from "./config";
import { FastifyEntrypointBuilder } from "./builder";

class FastifyLifecyclePlugin<S extends AppRequiredServices> {
  readonly #lifecycle: LifecycleManagerBuilder<S>;
  constructor(lifecycle: LifecycleManagerBuilder<S>) {
    this.#lifecycle = lifecycle;
  }

  /**
   * Registers fastify instance in the application lifecycle
   * @see {@link FastifyEntrypointBuilder}
   * @param name entrypoint name
   * @param config config {@link FastifyConfig}
   * @param fn builder function
   * @example
   * builder.addFastifyEntrypoint("http", (builder) =>
   *   builder.configureApp((builder) =>
   *     builder.useOpenApi()
   *       .fastify.get("/" => "Hello world!")
   *     )
   * )
   * @example
   * builder.addFastifyEntrypoint("http", { host: "127.0.0.1" }, (builder) =>
   *   builder.configureApp((builder) =>
   *     builder.useOpenApi()
   *       .fastify.get("/" => "Hello world!")
   *     )
   * )
   */
  addFastifyEntrypoint<B extends FastifyEntrypointBuilder<S>>(
    name: string,
    fn: (builder: B, services: S) => B
  ): this;
  addFastifyEntrypoint<B extends FastifyEntrypointBuilder<S>>(
    name: string,
    config: FastifyConfig,
    fn: (builder: B, services: S) => B
  ): this;
  addFastifyEntrypoint<
    B extends FastifyEntrypointBuilder<S>,
    Fn extends (builder: B, services: S) => B,
  >(name: string, configOrFn: FastifyConfig | Fn, maybeFn?: Fn) {
    const fn = typeof configOrFn === "object" ? maybeFn! : configOrFn;
    const config = typeof configOrFn === "object" ? configOrFn : undefined;

    const builder = new FastifyEntrypointBuilder(
      this.#lifecycle.services,
      this.#lifecycle.healthchecks,
      name,
      config
    );
    const entrypoint = fn(builder as B, this.#lifecycle.services).build();

    this.#lifecycle.addEntrypoint(name, () => entrypoint);

    return this;
  }
}

/** Fastify lifecycle plugin */
export const lifecyclePlugin = (<S extends AppRequiredServices>(
  lifecycle: LifecycleManagerBuilder<S>
) => new FastifyLifecyclePlugin(lifecycle)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredServices>
>;
