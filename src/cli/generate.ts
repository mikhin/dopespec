import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

import type { DecisionDef } from "../schema/decisions.js";
import type { ModelDef } from "../schema/model.js";

import {
  generateCommands,
  generateDecisionEvaluate,
  generateDecisionTable,
  generateDecisionTests,
  generateE2EStubs,
  generateEvents,
  generateInvariants,
  generateMermaid,
  generateOrchestrators,
  generateTests,
  generateTransitions,
  generateTypes,
  generateZod,
} from "../codegen/index.js";

// --- Generator registries (same mapping as e2e-proof) ---

const modelGenerators: { ext: string; fn: (m: ModelDef) => string }[] = [
  { ext: "types.ts", fn: generateTypes },
  { ext: "transitions.ts", fn: generateTransitions },
  { ext: "events.ts", fn: generateEvents },
  { ext: "commands.ts", fn: generateCommands },
  { ext: "invariants.ts", fn: generateInvariants },
  { ext: "orchestrators.ts", fn: generateOrchestrators },
  { ext: "test.ts", fn: generateTests },
  { ext: "e2e.ts", fn: generateE2EStubs },
  { ext: "zod.ts", fn: generateZod },
  { ext: "mermaid.md", fn: generateMermaid },
];

const decisionGenerators: {
  ext: string;
  fn: (d: DecisionDef) => string;
}[] = [
  { ext: "evaluate.ts", fn: generateDecisionEvaluate },
  { ext: "test.ts", fn: generateDecisionTests },
  { ext: "table.md", fn: generateDecisionTable },
];

export async function main(): Promise<void> {
  const { outdir, schemaPath } = parseArgs(process.argv);

  const resolved = resolve(schemaPath);

  if (!existsSync(resolved)) {
    console.error(`Schema file not found: ${resolved}`);
    process.exit(1);
  }

  // Default outdir: "generated" sibling to the schema file
  const outPath = outdir
    ? resolve(outdir)
    : join(dirname(resolved), "generated");

  // Dynamic import of schema file (tsx handles .ts resolution)
  const schemaUrl = pathToFileURL(resolved).href;
  const mod = (await import(schemaUrl)) as Record<string, unknown>;

  // Collect models and decisions from exports
  const models: { def: ModelDef; name: string }[] = [];
  const decisionDefs: { def: DecisionDef; name: string }[] = [];

  for (const value of Object.values(mod)) {
    if (isModelDef(value)) {
      models.push({ def: value, name: value.name.toLowerCase() });
    } else if (isDecisionDef(value)) {
      decisionDefs.push({ def: value, name: value.name.toLowerCase() });
    }
  }

  if (models.length === 0 && decisionDefs.length === 0) {
    console.error("No model() or decisions() exports found in schema file.");
    process.exit(1);
  }

  console.log(`Generating into ${outPath}/\n`);

  const filesWritten = generate(models, decisionDefs, outPath);

  console.log(`\nDone — ${String(filesWritten)} files written to ${outPath}`);
}

function generate(
  models: { def: ModelDef; name: string }[],
  decisionDefs: { def: DecisionDef; name: string }[],
  outPath: string,
): number {
  mkdirSync(outPath, { recursive: true });

  let filesWritten = 0;

  for (const m of models) {
    for (const gen of modelGenerators) {
      const content = gen.fn(m.def);

      if (!content) continue;

      const filename = `${m.name}.${gen.ext}`;

      writeFileSync(join(outPath, filename), content);
      filesWritten++;
      console.log(`  ${filename}`);
    }
  }

  for (const d of decisionDefs) {
    for (const gen of decisionGenerators) {
      const content = gen.fn(d.def);

      if (!content) continue;

      const filename = `${d.name}.${gen.ext}`;

      writeFileSync(join(outPath, filename), content);
      filesWritten++;
      console.log(`  ${filename}`);
    }
  }

  return filesWritten;
}

function isDecisionDef(value: unknown): value is DecisionDef {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    (value as { kind: unknown }).kind === "decision"
  );
}

function isModelDef(value: unknown): value is ModelDef {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    (value as { kind: unknown }).kind === "model"
  );
}

function parseArgs(argv: string[]): {
  outdir: string | undefined;
  schemaPath: string;
} {
  const args = argv.slice(2);

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log("Usage: dopespec generate <schema-file> [--outdir <dir>]");
    console.log("\nDefault output: generated/ sibling to the schema file");
    process.exit(0);
  }

  const command = args[0];

  if (command !== "generate") {
    console.error(`Unknown command: ${command}`);
    console.error("Usage: dopespec generate <schema-file> [--outdir <dir>]");
    process.exit(1);
  }

  // Parse named flags first, remaining positional is the schema path
  const outdirIdx = args.indexOf("--outdir");
  let outdir: string | undefined;

  if (outdirIdx !== -1) {
    outdir = args[outdirIdx + 1];

    if (!outdir || outdir.startsWith("--")) {
      console.error("--outdir requires a directory path");
      process.exit(1);
    }
  }

  // Schema path: first positional arg after "generate" that isn't a flag or flag value
  const flagIndices = new Set<number>();

  if (outdirIdx !== -1) {
    flagIndices.add(outdirIdx);
    flagIndices.add(outdirIdx + 1);
  }

  let schemaPath: string | undefined;

  for (let i = 1; i < args.length; i++) {
    if (flagIndices.has(i)) continue;
    if (args[i]?.startsWith("--")) continue;
    schemaPath = args[i];
    break;
  }

  if (!schemaPath) {
    console.error("Missing schema file path");
    console.error("Usage: dopespec generate <schema-file> [--outdir <dir>]");
    process.exit(1);
  }

  return { outdir, schemaPath };
}

await main();
