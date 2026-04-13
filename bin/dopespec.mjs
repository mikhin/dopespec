#!/usr/bin/env node

// Thin wrapper: spawn tsx to run the CLI with TypeScript support.
// tsx handles .js→.ts import resolution that schema files rely on.

import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cli = join(__dirname, "..", "dist", "cli", "generate.js");

// Resolve tsx from dopespec's own node_modules so the user doesn't need to install it
const require = createRequire(import.meta.url);
const tsxLoader = require.resolve("tsx");

try {
  execFileSync(
    process.execPath,
    ["--import", tsxLoader, cli, ...process.argv.slice(2)],
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
