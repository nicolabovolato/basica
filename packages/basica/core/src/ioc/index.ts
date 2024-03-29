export type Services<C> = C extends IocContainer<infer S> ? S : never;

export class IocContainer<S extends Record<string, unknown>> {
  #container = {} as S;

  #add<T, K extends string>(key: K, item: T) {
    this.#container[key] = item as S[K];
    return this as IocContainer<S & { readonly [P in K]: T }>;
  }

  addTransient<T, K extends string>(key: K, factory: (services: S) => T) {
    return this.#add(key, () => factory(this.#container));
  }

  addSingleton<T, K extends string>(key: K, factory: (services: S) => T) {
    return this.#add(key, factory(this.#container));
  }

  get services() {
    return this.#container;
  }
}
