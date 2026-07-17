---
"@basica/core": patch
---

Clearer application lifecycle logging. On startup the manager now logs a one-line pre-flight summary of everything it manages — e.g. `Lifecycle: 2 service(s) (1 startable, 1 stoppable), 1 entrypoint(s) (1 startable, 1 stoppable)` — before starting anything, and the per-phase lines drop the confusing `N/N` counts (previously you'd see `Starting 1/1 service(s)` even after registering more). Shutdown also no longer logs a `No <kind>(s) to stop` line for empty collections (matching startup, which stays silent for them). Also fixes a shutdown-failure log/span message that incorrectly read "Failed to start".
