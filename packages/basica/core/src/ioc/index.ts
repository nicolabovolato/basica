export type UnknownContainerItems = Record<string, unknown>;

export type EmptyContainerItems = Record<never, never>;

/** Dependency injection container */
export class IocContainer<
  D extends UnknownContainerItems = EmptyContainerItems,
> {
  #container: UnknownContainerItems = {};

  #add<T, K extends string>(key: K, item: T) {
    this.#container[key] = item;
    return this as unknown as IocContainer<D & { readonly [P in K]: T }>;
  }

  get items() {
    return Object.freeze({ ...this.#container }) as D;
  }

  /** Adds a service that is istantiated each time is requested */
  addTransient<T, K extends string>(key: K, factory: (items: D) => T) {
    return this.#add(key, () => factory(this.items));
  }

  /** Adds a service that is istantiated only once */
  addSingleton<T, K extends string>(key: K, factory: (items: D) => T) {
    return this.#add(key, factory(this.items));
  }
}
