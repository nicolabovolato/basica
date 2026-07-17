import { AppRequiredDeps, LifecycleManagerBuilder } from "@basica/core";
import { Plugin, RegistersEntrypoint } from "@basica/core/utils";

import { FastifyEntrypointBuilder } from "./builder";
import { FastifyConfig } from "./config";
import { FastifyEntrypoint } from "./entrypoint";

class FastifyLifecyclePlugin<D extends AppRequiredDeps> {
  readonly #lifecycle: LifecycleManagerBuilder<D>;
  constructor(lifecycle: LifecycleManagerBuilder<D>) {
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
  addFastifyEntrypoint<
    const K extends string,
    B extends FastifyEntrypointBuilder<D>,
  >(
    name: K,
    fn: (builder: B, deps: D) => B,
  ): this & RegistersEntrypoint<K, FastifyEntrypoint>;
  addFastifyEntrypoint<
    const K extends string,
    B extends FastifyEntrypointBuilder<D>,
  >(
    name: K,
    config: FastifyConfig,
    fn: (builder: B, deps: D) => B,
  ): this & RegistersEntrypoint<K, FastifyEntrypoint>;
  addFastifyEntrypoint<
    B extends FastifyEntrypointBuilder<D>,
    Fn extends (builder: B, deps: D) => B,
  >(name: string, configOrFn: FastifyConfig | Fn, maybeFn?: Fn) {
    const fn = typeof configOrFn === "object" ? maybeFn! : configOrFn;
    const config = typeof configOrFn === "object" ? configOrFn : undefined;

    const builder = new FastifyEntrypointBuilder(
      this.#lifecycle.deps,
      this.#lifecycle.healthcheckManager,
      name,
      config,
    );
    const entrypoint = fn(builder as B, this.#lifecycle.deps).build();

    this.#lifecycle.addEntrypoint(name, () => entrypoint);

    return this as this & RegistersEntrypoint<string, FastifyEntrypoint>;
  }
}

/** Fastify lifecycle plugin */
export const lifecyclePlugin = (<D extends AppRequiredDeps>(
  lifecycle: LifecycleManagerBuilder<D>,
) => new FastifyLifecyclePlugin<D>(lifecycle)) satisfies Plugin<
  LifecycleManagerBuilder<AppRequiredDeps>
>;
