export type Plugin<T, B = unknown> = (base: T) => B;

/**
 * Phantom key under which a plugin's builder surface advertises what it registers.
 */
export declare const lifecyclePluginRegistrations: unique symbol;

/**
 * Holds what a lifecycle plugin registers into the application lifecycle: healthchecks (`H`),
 * services (`S`) and entrypoints (`E`)
 */
export interface LifecyclePluginRegistrations<
  H = unknown,
  S = unknown,
  E = unknown,
> {
  readonly [lifecyclePluginRegistrations]: {
    healthchecks: H;
    services: S;
    entrypoints: E;
  };
}

/**
 * Advertises the plugin registers a single service named `K` of type `V`.
 * Return `this & RegistersService<K, V>` from a method that calls `lifecycle.addService(K, …)`
 * @example
 * export class MyPlugin<D extends AppRequiredDeps> {
 *   constructor(private readonly lifecycle: LifecycleManagerBuilder<D>) {}
 *
 *   addThing<const K extends string>(name: K): this & RegistersService<K, Thing> {
 *     this.lifecycle.addService(name, () => thing);
 *     return this as this & RegistersService<K, Thing>;
 *   }
 * }
 */
export type RegistersService<
  K extends string,
  V,
> = LifecyclePluginRegistrations<unknown, { readonly [P in K]: V }, unknown>;
/** See {@link RegistersService}. */
export type RegistersEntrypoint<
  K extends string,
  V,
> = LifecyclePluginRegistrations<unknown, unknown, { readonly [P in K]: V }>;
/** See {@link RegistersService}. */
export type RegistersHealthcheck<
  K extends string,
  V,
> = LifecyclePluginRegistrations<{ readonly [P in K]: V }, unknown, unknown>;

/** Healthchecks a plugin result advertises via {@link LifecyclePluginRegistrations} (else `unknown`). */
export type RegisteredHealthchecks<R> =
  R extends LifecyclePluginRegistrations<infer H, unknown, unknown>
    ? H
    : unknown;
/** Services a plugin result advertises via {@link LifecyclePluginRegistrations} (else `unknown`). */
export type RegisteredServices<R> =
  R extends LifecyclePluginRegistrations<unknown, infer S, unknown>
    ? S
    : unknown;
/** Entrypoints a plugin result advertises via {@link LifecyclePluginRegistrations} (else `unknown`). */
export type RegisteredEntrypoints<R> =
  R extends LifecyclePluginRegistrations<unknown, unknown, infer E>
    ? E
    : unknown;
