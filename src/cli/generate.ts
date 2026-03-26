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

// --- Generator registries ---
// "generated/" files are always overwritten; "src/" files are generate-once.

const generatedGenerators: { ext: string; fn: (m: ModelDef) => string }[] = [
  { ext: "types.ts", fn: generateTypes },
  { ext: "transitions.ts", fn: generateTransitions },
  { ext: "events.ts", fn: generateEvents },
  { ext: "commands.ts", fn: generateCommands },
  { ext: "invariants.ts", fn: generateInvariants },
  { ext: "test.ts", fn: generateTests },
  { ext: "zod.ts", fn: generateZod },
  { ext: "mermaid.md", fn: generateMermaid },
];

const srcGenerators: { ext: string; fn: (m: ModelDef) => string }[] = [
  { ext: "orchestrators.ts", fn: generateOrchestrators },
  { ext: "e2e.ts", fn: generateE2EStubs },
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

  // Two-folder output: generated/ (always overwritten) + src/ (user code, generate-once)
  const baseDir = outdir ? resolve(outdir) : dirname(resolved);
  const generatedPath = join(baseDir, "generated");
  const srcPath = join(baseDir, "src");

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

  console.log(`Generating into ${generatedPath}/`);
  console.log(`User code into  ${srcPath}/\n`);

  const counts = generate(models, decisionDefs, generatedPath, srcPath);

  const parts = [`${String(counts.generated)} in generated/`];

  if (counts.src > 0) parts.push(`${String(counts.src)} in src/`);

  console.log(`\nDone — ${parts.join(", ")}`);

  if (counts.skipped > 0) {
    console.log(
      `(${String(counts.skipped)} src file${counts.skipped > 1 ? "s" : ""} skipped — already exist)`,
    );
  }
}

function generate(
  models: { def: ModelDef; name: string }[],
  decisionDefs: { def: DecisionDef; name: string }[],
  generatedPath: string,
  srcPath: string,
): { generated: number; skipped: number; src: number } {
  mkdirSync(generatedPath, { recursive: true });
  mkdirSync(srcPath, { recursive: true });

  let generated = 0;
  let skipped = 0;
  let src = 0;

  for (const m of models) {
    generated += writeGeneratedFiles(
      m.name,
      generatedGenerators,
      m.def,
      generatedPath,
      "generated",
    );

    const srcResult = writeSrcFiles(m.name, m.def, srcPath);

    src += srcResult.written;
    skipped += srcResult.skipped;
  }

  for (const d of decisionDefs) {
    generated += writeGeneratedFiles(
      d.name,
      decisionGenerators,
      d.def,
      generatedPath,
      "generated",
    );
  }

  return { generated, skipped, src };
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
    console.log(
      "\nDefault output: generated/ (always overwritten) + src/ (user code, generate-once)",
    );
    console.log(
      "Both folders are siblings to the schema file (or under --outdir).",
    );
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

function writeGeneratedFiles<T>(
  name: string,
  generators: { ext: string; fn: (def: T) => string }[],
  def: T,
  outPath: string,
  prefix: string,
): number {
  let count = 0;

  for (const gen of generators) {
    const content = gen.fn(def);

    if (!content) continue;

    const filename = `${name}.${gen.ext}`;

    writeFileSync(join(outPath, filename), content);
    count++;
    console.log(`  ${prefix}/${filename}`);
  }

  return count;
}

function writeSrcFiles(
  name: string,
  def: ModelDef,
  srcPath: string,
): { skipped: number; written: number } {
  let written = 0;
  let skipped = 0;

  for (const gen of srcGenerators) {
    const content = gen.fn(def);

    if (!content) continue;

    const filename = `${name}.${gen.ext}`;
    const filePath = join(srcPath, filename);

    if (existsSync(filePath)) {
      console.log(
        `  src/${filename} (exists, skipped — new handlers not added)`,
      );
      skipped++;
      continue;
    }

    writeFileSync(filePath, content);
    written++;
    console.log(`  src/${filename}`);
  }

  return { skipped, written };
}

await main();
