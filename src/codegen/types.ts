import type { ModelDef } from "../schema/model.js";

import { isOptional } from "../schema/props.js";
import {
  capitalize,
  getRelations,
  propKindToTS,
  relationIdField,
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

  // Add relation fields: belongsTo → string (foreign key id), hasMany → string[] (ids)
  for (const [key, rel] of relations) {
    const targetName = rel.target.name;
    const fieldName = relationIdField(key, rel.kind);
    const tsType = rel.kind === "belongsTo" ? "string" : "string[]";

    propsFields.push(`  ${fieldName}: ${tsType}; // ${rel.kind} ${targetName}`);
  }

  lines.push(`export type ${typeName}Props = {`);
  lines.push(...propsFields);
  lines.push(`};`);

  return lines.join("\n") + "\n";
};
