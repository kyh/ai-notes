import { run } from "node:test";
import { spec as SpecReporter } from "node:test/reporters";

const TEST_GLOB = "src/**/*.test.ts";

/**
 * `node --test <glob>` exits 0 when the glob matches nothing, so a stale
 * pattern or a deleted suite reads as a passing gate. Driving the runner
 * through its API is the only place the summary counts are visible, which is
 * what lets an empty run fail instead of quietly succeeding.
 */
const stream = run({
  globPatterns: [TEST_GLOB],
  execArgv: ["--import", "tsx", "--import", "./scripts/test-globals.ts"],
});

let testsRun = 0;
let runSucceeded = false;

stream.on("test:summary", (summary) => {
  // Per-file summaries carry a `file`; the run-wide one does not.
  if (summary.file !== undefined) return;
  testsRun = summary.counts.tests;
  runSucceeded = summary.success;
});

stream.on("end", () => {
  if (testsRun === 0) {
    console.error(`No tests ran — '${TEST_GLOB}' matched no test files.`);
    process.exitCode = 1;
    return;
  }
  if (!runSucceeded) process.exitCode = 1;
});

stream.compose(new SpecReporter()).pipe(process.stdout);
