export type Services<C> = C extends IocContainer<infer S> ? S : never;

/** Dependency injection container */
export class IocContainer<S extends Record<string, unknown>> {
  #container = {} as S;

  #add<T, K extends string>(key: K, item: T) {
    this.#container[key] = item as S[K];
    return this as IocContainer<S & { readonly [P in K]: T }>;
  }

  /** Adds a service that is istantiated each time is requested */
  addTransient<T, K extends string>(key: K, factory: (services: S) => T) {
    return this.#add(key, () => factory(this.#container));
  }

  /**  Adds a service that is istantiated only once */
  addSingleton<T, K extends string>(key: K, factory: (services: S) => T) {
    return this.#add(key, factory(this.#container));
  }

  get services() {
    return this.#container;
  }
}
