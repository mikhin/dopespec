import { main as runGenerate } from "./generate.js";
import { runMap } from "./map.js";
const subcommand = process.argv[2];
if (subcommand === undefined ||
    subcommand === "-h" ||
    subcommand === "--help") {
    console.log("Usage: dopespec <command> [...]\n");
    console.log("Commands:");
    console.log("  generate <schema-file> [--outdir <dir>]   types, tests, validators, diagrams");
    console.log("  map <schema-path> [--out <file>]          aggregate feature map (by area)");
    process.exit(0);
}
if (subcommand === "generate") {
    await runGenerate();
}
else if (subcommand === "map") {
    await runMap();
}
else {
    console.error(`Unknown command: ${subcommand}`);
    console.error("Run `dopespec --help` for usage.");
    process.exit(1);
}
//# sourceMappingURL=index.js.map