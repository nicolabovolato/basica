// Fixture app driven by `run()`, spawned as a subprocess by the integration
// test under deno (which runs TS natively). Behaviour is selected via MODE.
import { AppBuilder, type IEntrypoint } from "@basica/core";

// @ts-expect-error "allowImportingTsExtensions"
import { run } from "../../../src/index.ts";

const mode = process.env.MODE ?? "ok";

const keepalive = () => {
  let handle: NodeJS.Timeout | undefined;
  return {
    start: async () => {
      if (mode === "start-fail") throw new Error("boom");
      handle = setInterval(() => {}, 1000);
      console.log("MARKER:STARTED");
    },
    shutdown: async () => {
      // never resolve: exercises the stop-timeout / hard-kill path
      if (mode === "hang") return new Promise<void>(() => {});
      clearInterval(handle);
      console.log("MARKER:STOPPED");
    },
  } satisfies IEntrypoint;
};

const app = AppBuilder.registerDependencies()
  .configureLifecycle({ startupTimeoutMs: 200, shutdownTimeoutMs: 200 }, (b) =>
    b.addEntrypoint("keepalive", () => keepalive()),
  )
  .build();

run(app);
