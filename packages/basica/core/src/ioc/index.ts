export type Services<C> = C extends IocContainer<infer S> ? S : never;

/** Dependency injection container */
export class IocContainer<D extends Record<string, unknown>> {
  #container = {} as D;

  #add<T, K extends string>(key: K, item: T) {
    this.#container[key] = item as D[K];
    return this as IocContainer<D & { readonly [P in K]: T }>;
  }

  /** Adds a service that is istantiated each time is requested */
  addTransient<T, K extends string>(key: K, factory: (items: D) => T) {
    return this.#add(key, () => factory(this.#container));
  }

  /**  Adds a service that is istantiated only once */
  addSingleton<T, K extends string>(key: K, factory: (items: D) => T) {
    return this.#add(key, factory(this.#container));
  }

  get items() {
    return this.#container;
  }
}
