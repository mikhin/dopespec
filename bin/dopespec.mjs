#!/usr/bin/env node

// Thin wrapper: spawn tsx to run the CLI with TypeScript support.
// tsx handles .js→.ts import resolution that schema files rely on.

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = join(__dirname, "..", "dist", "cli", "generate.js");

try {
  execFileSync(
    process.execPath,
    ["--import", "tsx", cli, ...process.argv.slice(2)],
    { stdio: "inherit" },
  );
} catch (error) {
  // execFileSync throws on non-zero exit — forward the child's exit code
  const status =
    error && typeof error === "object" && "status" in error
      ? (error.status ?? 1)
      : 1;
  process.exit(status);
}
