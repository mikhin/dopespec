/**
 * End-to-end proof: run ALL generators on every pet-store model/decision,
 * write output to a temp directory, compile the result with tsc.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

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
import {
  CreditTier,
  Customer,
  Order,
  Pet,
  PetAdoptionFee,
} from "../examples/pet-store.js";

const models = [
  { def: Customer as ModelDef, name: "customer" },
  { def: Pet as ModelDef, name: "pet" },
  { def: Order as ModelDef, name: "order" },
];

const decisionDefs = [
  { def: CreditTier as DecisionDef, name: "credit-tier" },
  { def: PetAdoptionFee as DecisionDef, name: "pet-adoption-fee" },
];

// Model generators that go into generated/ (always overwritten)
const generatedGenerators: {
  ext: string;
  fn: (m: ModelDef) => string;
  ts: boolean;
}[] = [
  { ext: "types.ts", fn: generateTypes, ts: true },
  { ext: "transitions.ts", fn: generateTransitions, ts: true },
  { ext: "events.ts", fn: generateEvents, ts: true },
  { ext: "commands.ts", fn: generateCommands, ts: true },
  { ext: "invariants.ts", fn: generateInvariants, ts: true },
  { ext: "test.ts", fn: generateTests, ts: true },
  { ext: "zod.ts", fn: generateZod, ts: true },
  { ext: "mermaid.md", fn: generateMermaid, ts: false },
];

// Model generators that go into src/ (generate-once, imports from ../generated/)
const srcGenerators: {
  ext: string;
  fn: (m: ModelDef) => string;
  ts: boolean;
}[] = [
  { ext: "orchestrators.ts", fn: generateOrchestrators, ts: true },
  { ext: "e2e.ts", fn: generateE2EStubs, ts: true },
];

// 3 decision generators
const decisionGenerators: {
  ext: string;
  fn: (d: DecisionDef) => string;
  ts: boolean;
}[] = [
  { ext: "evaluate.ts", fn: generateDecisionEvaluate, ts: true },
  { ext: "test.ts", fn: generateDecisionTests, ts: true },
  { ext: "table.md", fn: generateDecisionTable, ts: false },
];

/** Run generators, write TS output to dir, return list of file paths. */
function writeGenFiles<T>(
  defs: { def: T; name: string }[],
  generators: { ext: string; fn: (d: T) => string; ts: boolean }[],
  dir: string,
): string[] {
  const paths: string[] = [];

  for (const d of defs) {
    for (const gen of generators) {
      const content = gen.fn(d.def);

      if (!content || !gen.ts) continue;

      const filename = `${d.name}.${gen.ext}`;

      writeFileSync(join(dir, filename), content);
      paths.push(join(dir, filename));
    }
  }

  return paths;
}

describe("e2e-proof: pet-store full generation + tsc compile", () => {
  // Generators that must produce output for every pet-store model
  // (all three have props, transitions, actions, and constraints or scenarios).
  const alwaysNonEmpty = [
    "types.ts",
    "transitions.ts",
    "events.ts",
    "commands.ts",
    "orchestrators.ts",
    "e2e.ts",
    "zod.ts",
    "mermaid.md",
  ];

  // Customer has no scenarios or constraints, so these are legitimately empty.
  const emptyForCustomer = ["test.ts", "invariants.ts"];

  it("every model generator produces expected output", () => {
    const allModelGenerators = [...generatedGenerators, ...srcGenerators];

    for (const m of models) {
      for (const gen of allModelGenerators) {
        const content = gen.fn(m.def);
        const filename = `${m.name}.${gen.ext}`;

        if (alwaysNonEmpty.includes(gen.ext)) {
          expect(content, `${filename} should not be empty`).toBeTruthy();
        } else if (
          m.name === "customer" &&
          emptyForCustomer.includes(gen.ext)
        ) {
          expect(content, `${filename} expected empty`).toBe("");
        }
      }
    }
  });

  it("every decision generator produces output", () => {
    for (const d of decisionDefs) {
      for (const gen of decisionGenerators) {
        const content = gen.fn(d.def);
        const filename = `${d.name}.${gen.ext}`;

        expect(content, `${filename} should not be empty`).toBeTruthy();
      }
    }
  });

  it("all generated TypeScript compiles with strict tsc", () => {
    const dir = mkdtempSync(join(tmpdir(), "dopespec-e2e-proof-"));
    const generatedDir = join(dir, "generated");
    const srcDir = join(dir, "src");

    mkdirSync(generatedDir, { recursive: true });
    mkdirSync(srcDir, { recursive: true });

    try {
      writeFileSync(join(dir, "package.json"), '{"type":"module"}');

      const tsFiles = [
        ...writeGenFiles(models, generatedGenerators, generatedDir),
        ...writeGenFiles(models, srcGenerators, srcDir),
        ...writeGenFiles(decisionDefs, decisionGenerators, generatedDir),
      ];

      // Compile all TS files together
      const program = ts.createProgram(tsFiles, {
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        // Generated test/zod files import vitest/zod which aren't in the temp dir.
        // skipLibCheck avoids erroring on missing external type declarations.
        skipLibCheck: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
      });

      const diagnostics = ts.getPreEmitDiagnostics(program);

      // Filter out "cannot find module" errors for external packages (vitest, zod)
      // — these are expected since the temp dir has no node_modules.
      const errors = diagnostics.filter((d) => {
        if (d.category !== ts.DiagnosticCategory.Error) return false;

        const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");

        if (
          msg.includes("Cannot find module 'vitest'") ||
          msg.includes("Cannot find module 'zod'")
        ) {
          return false;
        }

        return true;
      });

      if (errors.length > 0) {
        const messages = errors.map((d) => {
          const file = d.file?.fileName ?? "unknown";
          const line =
            d.file && d.start != null
              ? d.file.getLineAndCharacterOfPosition(d.start).line + 1
              : "?";
          const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");

          return `${file}:${line} — ${msg}`;
        });

        // Print all errors for debugging before failing
        expect(messages).toEqual([]);
      }

      expect(errors).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
