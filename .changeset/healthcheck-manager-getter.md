---
"@basica/core": patch
---

`LifecycleManagerBuilder.healthchecks` now returns the registered healthcheck items, symmetric with `services` and `entrypoints`. The manager that runs them is available through the new `healthcheckManager` getter.
