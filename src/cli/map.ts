import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

import type { FeatureConstruct, FeatureEntry } from "../codegen/feature-map.js";

import { generateFeatureMap } from "../codegen/index.js";

const USAGE = "Usage: dopespec map <schema-path> [--out <file>]";

export async function runMap(): Promise<void> {
  const { outFile, schemaPath } = parseArgs(process.argv);
  const resolved = resolve(schemaPath);

  if (!existsSync(resolved)) {
    console.error(`Schema path not found: ${resolved}`);
    process.exit(1);
  }

  const isDir = statSync(resolved).isDirectory();
  const root = isDir ? resolved : dirname(resolved);
  const files = isDir ? collectFiles(resolved) : [resolved];

  const entries = await collectEntries(files, root);

  if (entries.length === 0) {
    console.error("No model(), decisions(), or policy() exports found.");
    process.exit(1);
  }

  const out = outFile ? resolve(outFile) : join(root, "feature-map.md");

  writeFileSync(out, generateFeatureMap(entries));
  console.log(`Wrote ${out} (${String(entries.length)} constructs)`);
}

/** Group fallback: the construct's `area`, else its first folder under root, else "General". */
async function collectEntries(
  files: string[],
  root: string,
): Promise<FeatureEntry[]> {
  const seen = new Map<FeatureConstruct, FeatureEntry>();

  for (const file of files) {
    const mod = (await import(pathToFileURL(file).href)) as Record<
      string,
      unknown
    >;
    const fallback = firstSegment(root, file) ?? "General";

    for (const value of Object.values(mod)) {
      if (!isConstruct(value)) continue;

      const area = value.area ?? fallback;
      const existing = seen.get(value);

      if (!existing) {
        seen.set(value, { area, def: value });
      } else if (existing.area === "General" && area !== "General") {
        // A re-export (e.g. a barrel) saw it first with no folder — prefer the
        // folder-derived area discovered later.
        existing.area = area;
      }
    }
  }

  return [...seen.values()];
}

function collectFiles(dir: string): string[] {
  const out: string[] = [];

  for (const entry of readdirSync(dir).sort()) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      out.push(...collectFiles(full));
    } else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) {
      out.push(full);
    }
  }

  return out;
}

function firstSegment(root: string, file: string): string | undefined {
  const parts = relative(root, file).split(sep);

  return parts.length > 1 ? parts[0] : undefined;
}

function isConstruct(value: unknown): value is FeatureConstruct {
  if (typeof value !== "object" || value === null || !("kind" in value)) {
    return false;
  }

  const kind = (value as { kind: unknown }).kind;

  return kind === "model" || kind === "decision" || kind === "policy";
}

function parseArgs(argv: string[]): {
  outFile: string | undefined;
  schemaPath: string;
} {
  const args = argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(USAGE);
    process.exit(0);
  }

  const outIdx = args.indexOf("--out");
  let outFile: string | undefined;

  if (outIdx !== -1) {
    outFile = args[outIdx + 1];

    if (!outFile || outFile.startsWith("--")) {
      console.error("--out requires a file path");
      process.exit(1);
    }
  }

  const flagIndices = new Set<number>();

  if (outIdx !== -1) {
    flagIndices.add(outIdx);
    flagIndices.add(outIdx + 1);
  }

  let schemaPath: string | undefined;

  // Skip args[0] ("map"); first remaining positional is the schema path.
  for (let i = 1; i < args.length; i++) {
    if (flagIndices.has(i)) continue;
    if (args[i]?.startsWith("--")) continue;
    schemaPath = args[i];
    break;
  }

  if (!schemaPath) {
    console.error(`Missing schema path\n${USAGE}`);
    process.exit(1);
  }

  return { outFile, schemaPath };
}
