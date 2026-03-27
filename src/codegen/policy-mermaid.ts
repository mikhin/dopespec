import type { PolicyDef } from "../schema/policy.js";

import { capitalize } from "./utils.js";

/**
 * Generate Mermaid interaction diagram for all policies targeting a single model.
 * Output: generated/${targetModel}.policy-mermaid.md
 */
export const generatePolicyMermaid = (
  targetModelName: string,
  policies: PolicyDef[],
): string => {
  if (policies.length === 0) return "";

  const targetName = capitalize(targetModelName);
  const lines: string[] = [];

  lines.push(`graph LR`);

  // Collect unique required model connections
  const connections = new Set<string>();

  for (const policy of policies) {
    for (const rel of Object.values(policy.requires)) {
      const reqName = capitalize(rel.target.name);

      connections.add(`  ${reqName} -->|${rel.kind}| ${targetName}`);
    }

    // Policy → model.action connection
    const effects = [...new Set(policy.rules.map((r) => r.effect))].join("/");

    lines.push(
      `  ${policy.name} -->|${effects}| ${targetName}.${policy.on.action}`,
    );
  }

  // Add relation connections (deduplicated)
  for (const conn of [...connections].sort()) {
    lines.push(conn);
  }

  lines.push("");

  return lines.join("\n");
};
