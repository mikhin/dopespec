import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { generateCommands, generateDecisionEvaluate, generateDecisionTable, generateDecisionTests, generateE2EStubs, generateEvents, generateInvariants, generateMermaid, generateOrchestrators, generatePolicyIndex, generatePolicyMermaid, generatePolicyTests, generatePolicyValidator, generateTests, generateTransitions, generateTypes, generateZod, } from "../codegen/index.js";
import { toKebabCase } from "../codegen/utils.js";
// --- Generator registries ---
// "generated/" files are always overwritten; "src/" files are generate-once.
const generatedGenerators = [
    { ext: "types.ts", fn: generateTypes },
    { ext: "transitions.ts", fn: generateTransitions },
    { ext: "events.ts", fn: generateEvents },
    { ext: "commands.ts", fn: generateCommands },
    { ext: "invariants.ts", fn: generateInvariants },
    { ext: "test.ts", fn: generateTests },
    { ext: "zod.ts", fn: generateZod },
    { ext: "mermaid.md", fn: generateMermaid },
];
const srcGenerators = [
    { ext: "orchestrators.ts", fn: generateOrchestrators },
    { ext: "e2e.ts", fn: generateE2EStubs },
];
const decisionGenerators = [
    { ext: "evaluate.ts", fn: generateDecisionEvaluate },
    { ext: "test.ts", fn: generateDecisionTests },
    { ext: "table.md", fn: generateDecisionTable },
];
export async function main() {
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
    const mod = (await import(schemaUrl));
    // Collect models, decisions, and policies from exports
    const models = [];
    const decisionDefs = [];
    const policyDefs = [];
    for (const value of Object.values(mod)) {
        if (isModelDef(value)) {
            models.push({ def: value, name: toKebabCase(value.name) });
        }
        else if (isDecisionDef(value)) {
            decisionDefs.push({ def: value, name: toKebabCase(value.name) });
        }
        else if (isPolicyDef(value)) {
            policyDefs.push({ def: value, name: toKebabCase(value.name) });
        }
    }
    if (models.length === 0 &&
        decisionDefs.length === 0 &&
        policyDefs.length === 0) {
        console.error("No model(), decisions(), or policy() exports found in schema file.");
        process.exit(1);
    }
    console.log(`Generating into ${generatedPath}/`);
    console.log(`User code into  ${srcPath}/\n`);
    const counts = generate(models, decisionDefs, policyDefs, generatedPath, srcPath);
    const parts = [`${String(counts.generated)} in generated/`];
    if (counts.src > 0)
        parts.push(`${String(counts.src)} in src/`);
    console.log(`\nDone — ${parts.join(", ")}`);
    if (counts.skipped > 0) {
        console.log(`(${String(counts.skipped)} src file${counts.skipped > 1 ? "s" : ""} skipped — already exist)`);
    }
}
function buildPolicyByModelAction(policyDefs) {
    const result = new Map();
    for (const p of policyDefs) {
        const modelName = p.def.on.model.name;
        let actions = result.get(modelName);
        if (!actions) {
            actions = new Map();
            result.set(modelName, actions);
        }
        let policyNames = actions.get(p.def.on.action);
        if (!policyNames) {
            policyNames = [];
            actions.set(p.def.on.action, policyNames);
        }
        policyNames.push(p.def.name);
    }
    return result;
}
function generate(models, decisionDefs, policyDefs, generatedPath, srcPath) {
    mkdirSync(generatedPath, { recursive: true });
    mkdirSync(srcPath, { recursive: true });
    let generated = 0;
    let skipped = 0;
    let src = 0;
    // Build model lookup for policy generators
    const modelLookup = new Map();
    for (const m of models) {
        modelLookup.set(m.def.name, m.def);
    }
    // Build policy lookup for orchestrator generator
    const policyByModelAction = buildPolicyByModelAction(policyDefs);
    for (const m of models) {
        generated += writeGeneratedFiles(m.name, generatedGenerators, m.def, generatedPath, "generated");
        const srcResult = writeSrcFiles(m.name, m.def, srcPath, policyByModelAction.get(m.def.name));
        src += srcResult.written;
        skipped += srcResult.skipped;
    }
    for (const d of decisionDefs) {
        generated += writeGeneratedFiles(d.name, decisionGenerators, d.def, generatedPath, "generated");
    }
    // --- Policy generators ---
    generated += generatePolicies(policyDefs, modelLookup, generatedPath);
    return { generated, skipped, src };
}
function generatePolicies(policyDefs, modelLookup, generatedPath) {
    if (policyDefs.length === 0)
        return 0;
    let generated = 0;
    // Group policies by target model
    const policyByModel = new Map();
    for (const p of policyDefs) {
        const targetName = p.def.on.model.name.toLowerCase();
        let policies = policyByModel.get(targetName);
        if (!policies) {
            policies = [];
            policyByModel.set(targetName, policies);
        }
        policies.push(p.def);
    }
    // Per-model policy files
    for (const [targetName, policies] of policyByModel) {
        generated += writePolicyFile(generatedPath, `${targetName}.policies.ts`, generatePolicyValidator(policies, modelLookup));
        generated += writePolicyFile(generatedPath, `${targetName}.policy.test.ts`, generatePolicyTests(targetName, policies, modelLookup));
        generated += writePolicyFile(generatedPath, `${targetName}.policy-mermaid.md`, generatePolicyMermaid(targetName, policies));
    }
    // Single policy index file
    const allPolicies = policyDefs.map((p) => p.def);
    generated += writePolicyFile(generatedPath, "policy-index.ts", generatePolicyIndex(allPolicies));
    return generated;
}
function isDecisionDef(value) {
    return (typeof value === "object" &&
        value !== null &&
        "kind" in value &&
        value.kind === "decision");
}
function isModelDef(value) {
    return (typeof value === "object" &&
        value !== null &&
        "kind" in value &&
        value.kind === "model");
}
function isPolicyDef(value) {
    return (typeof value === "object" &&
        value !== null &&
        "kind" in value &&
        value.kind === "policy");
}
function parseArgs(argv) {
    const args = argv.slice(2);
    if (args.includes("--help") || args.includes("-h") || args.length === 0) {
        console.log("Usage: dopespec generate <schema-file> [--outdir <dir>]");
        console.log("\nDefault output: generated/ (always overwritten) + src/ (user code, generate-once)");
        console.log("Both folders are siblings to the schema file (or under --outdir).");
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
    let outdir;
    if (outdirIdx !== -1) {
        outdir = args[outdirIdx + 1];
        if (!outdir || outdir.startsWith("--")) {
            console.error("--outdir requires a directory path");
            process.exit(1);
        }
    }
    // Schema path: first positional arg after "generate" that isn't a flag or flag value
    const flagIndices = new Set();
    if (outdirIdx !== -1) {
        flagIndices.add(outdirIdx);
        flagIndices.add(outdirIdx + 1);
    }
    let schemaPath;
    for (let i = 1; i < args.length; i++) {
        if (flagIndices.has(i))
            continue;
        if (args[i]?.startsWith("--"))
            continue;
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
function writeGeneratedFiles(name, generators, def, outPath, prefix) {
    let count = 0;
    for (const gen of generators) {
        const content = gen.fn(def);
        if (!content)
            continue;
        const filename = `${name}.${gen.ext}`;
        writeFileSync(join(outPath, filename), content);
        count++;
        console.log(`  ${prefix}/${filename}`);
    }
    return count;
}
function writePolicyFile(outPath, filename, content) {
    if (!content)
        return 0;
    writeFileSync(join(outPath, filename), content);
    console.log(`  generated/${filename}`);
    return 1;
}
function writeSrcFiles(name, def, srcPath, policyActions) {
    let written = 0;
    let skipped = 0;
    for (const gen of srcGenerators) {
        const content = gen.ext === "orchestrators.ts"
            ? generateOrchestrators(def, policyActions)
            : gen.fn(def);
        if (!content)
            continue;
        const filename = `${name}.${gen.ext}`;
        const filePath = join(srcPath, filename);
        if (existsSync(filePath)) {
            console.log(`  src/${filename} (exists, skipped — new handlers not added)`);
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
//# sourceMappingURL=generate.js.map