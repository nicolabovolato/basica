// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
export type Constructor<T = {}> = new (...args: any[]) => T;
