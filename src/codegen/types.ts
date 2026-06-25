import type { ModelDef } from "../schema/model.js";
import type { RelationDef } from "../schema/relations.js";

import { isOptional } from "../schema/props.js";
import {
  capitalize,
  getRelations,
  propKindToTS,
  relationIdField,
  toKebabCase,
} from "./utils.js";

/** Generate TypeScript type definitions from a model's props and relations. */
export const generateTypes = (model: ModelDef): string => {
  const hasProps = model.props && Object.keys(model.props).length > 0;
  const relations = getRelations(model);

  if (!hasProps && relations.length === 0) return "";

  const lines: string[] = [];
  const typeName = capitalize(model.name);
  const propEntries = model.props ? Object.entries(model.props) : [];

  // Generate union types for lifecycle and oneOf props
  for (const [key, prop] of propEntries) {
    if (prop.kind === "lifecycle" || prop.kind === "oneOf") {
      const unionName = `${typeName}${capitalize(key)}`;
      const values = (prop.values as readonly string[])
        .map((v) => `'${v}'`)
        .join(" | ");

      lines.push(`export type ${unionName} = ${values};`);
    }
  }

  if (lines.length > 0) lines.push("");

  // Generate props interface
  const propsFields = propEntries.map(([key, prop]) => {
    let tsType: string;

    if (prop.kind === "lifecycle" || prop.kind === "oneOf") {
      tsType = `${typeName}${capitalize(key)}`;
    } else {
      tsType = propKindToTS(prop);
    }

    const opt = isOptional(prop) ? "?" : "";

    return `  ${key}${opt}: ${tsType};`;
  });

  // Relation fields: belongsTo → id, hasMany → ids, embeds → nested child[].
  const imports = new Set<string>();

  propsFields.push(...relationTypeFields(relations, imports));

  lines.push(`export type ${typeName}Props = {`);
  lines.push(...propsFields);
  lines.push(`};`);

  const header =
    imports.size > 0 ? `${[...imports].sort().join("\n")}\n\n` : "";

  return header + lines.join("\n") + "\n";
};

/** Relation fields for a Props type; collects child-type imports for embeds. */
function relationTypeFields(
  relations: [string, RelationDef][],
  imports: Set<string>,
): string[] {
  return relations.map(([key, rel]) => {
    const targetName = rel.target.name;

    if (rel.kind === "embeds") {
      const childType = `${capitalize(targetName)}Props`;

      imports.add(
        `import type { ${childType} } from './${toKebabCase(targetName)}.types.js';`,
      );

      return `  ${key}: ${childType}[]; // embeds ${targetName}`;
    }

    const fieldName = relationIdField(key, rel.kind);
    const tsType = rel.kind === "belongsTo" ? "string" : "string[]";

    return `  ${fieldName}: ${tsType}; // ${rel.kind} ${targetName}`;
  });
}
