---
"@basica/core": patch
---

The app's registered item maps — `app.deps` / `app.services` / `app.entrypoints` / `app.healthchecks` — are now readonly, at both the type level and at runtime.

- The accumulator generics that fall back to a default (`IocContainer`, `AppBuilder`, `LifecycleManagerBuilder`) now default to a closed `Record<never, never>` instead of the `Record<string, unknown>` constraint. As a result `D`/`H`/`S`/`E` no longer carry a string index signature: reassigning or adding a key is a compile error. (Note: indexing with an *unregistered* key now errors as "property does not exist" instead of resolving to `unknown` — `app.services["not-registered"]` is a type error rather than `unknown`.)
- `IocContainer.items` returns a frozen shallow copy, so JS / `as any` callers can't mutate the map at runtime either.

The registered items themselves are untouched — not frozen and not deeply readonly — so spying on and calling methods of `app.services.x` etc. works exactly as before.
