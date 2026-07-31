import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

// The vitest process runs on Node; it spawns the fixture under deno (the only
// runtime this package's runner supports). RUNTIME exists for parity with the
// CI matrix (which invokes `test:deno`).
const RUNTIME = process.env.RUNTIME ?? "deno";
const argv: Record<string, string[]> = {
  deno: ["deno", "run", "-A"],
};
const [bin, ...flags] = argv[RUNTIME] ?? argv.deno;

const fixture = fileURLToPath(new URL("./fixtures/run.ts", import.meta.url));

const spawnFixture = (mode: string) => {
  const child = spawn(bin, [...flags, fixture], {
    env: { ...process.env, MODE: mode },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (d: Buffer) => (output += d.toString()));
  child.stderr.on("data", (d: Buffer) => (output += d.toString()));
  return {
    child,
    get output() {
      return output;
    },
  };
};

type Fixture = ReturnType<typeof spawnFixture>;

const waitForMarker = (proc: Fixture, marker: string) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(new Error(`timed out waiting for ${marker}:\n${proc.output}`)),
      10_000,
    );
    const check = () => {
      if (proc.output.includes(marker)) {
        clearTimeout(timer);
        resolve();
      }
    };
    proc.child.stdout.on("data", check);
    check();
  });

const waitForExit = (proc: Fixture) =>
  new Promise<number | null>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`process did not exit:\n${proc.output}`)),
      10_000,
    );
    proc.child.on("exit", (code) => {
      clearTimeout(timer);
      resolve(code);
    });
  });

test(`[${RUNTIME}] SIGTERM triggers a graceful stop and exits 0`, async () => {
  const proc = spawnFixture("ok");
  await waitForMarker(proc, "MARKER:STARTED");
  proc.child.kill("SIGTERM");
  const code = await waitForExit(proc);

  expect(proc.output).toContain("MARKER:STOPPED");
  expect(code).toBe(0);
});

test(`[${RUNTIME}] startup failure exits 1`, async () => {
  const proc = spawnFixture("start-fail");
  const code = await waitForExit(proc);

  expect(code).toBe(1);
});

test(`[${RUNTIME}] a hung shutdown still exits 1`, async () => {
  const proc = spawnFixture("hang");
  await waitForMarker(proc, "MARKER:STARTED");
  proc.child.kill("SIGTERM");
  const code = await waitForExit(proc);

  expect(code).toBe(1);
});
