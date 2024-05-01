import { AppRequiredDeps, LifecycleManagerBuilder } from "@basica/core";
import { Plugin } from "@basica/core/utils";

import { FastifyEntrypointBuilder } from "./builder";
import { FastifyConfig } from "./config";

class FastifyLifecyclePlugin<S extends AppRequiredDeps> {
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
    fn: (builder: B, deps: S) => B
  ): this;
  addFastifyEntrypoint<B extends FastifyEntrypointBuilder<S>>(
    name: string,
    config: FastifyConfig,
    fn: (builder: B, deps: S) => B
  ): this;
  addFastifyEntrypoint<
    B extends FastifyEntrypointBuilder<S>,
    Fn extends (builder: B, deps: S) => B,
  >(name: string, configOrFn: FastifyConfig | Fn, maybeFn?: Fn) {
    const fn = typeof configOrFn === "object" ? maybeFn! : configOrFn;
    const config = typeof configOrFn === "object" ? configOrFn : undefined;

    const builder = new FastifyEntrypointBuilder(
      this.#lifecycle.deps,
      this.#lifecycle.healthchecks,
      name,
      config
    );
    const entrypoint = fn(builder as B, this.#lifecycle.deps).build();

    this.#lifecycle.addEntrypoint(name, () => entrypoint);

    return this;
  }
}

/** Fastify lifecycle plugin */
export const lifecyclePlugin = (<S extends AppRequiredDeps>(
  lifecycle: LifecycleManagerBuilder<S>
) => new FastifyLifecyclePlugin(lifecycle)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredDeps>
>;
