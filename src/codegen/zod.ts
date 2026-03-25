import type { ModelDef } from "../schema/model.js";

import {
  capitalize,
  getRelations,
  propKindToZod,
  relationIdField,
} from "./utils.js";

/** Generate Zod validation schema from a model's props and relations. Targets Zod v3.x / v4.x (z.object, z.enum). */
export const generateZod = (model: ModelDef): string => {
  const hasProps = model.props && Object.keys(model.props).length > 0;
  const relations = getRelations(model);

  if (!hasProps && relations.length === 0) return "";

  const typeName = capitalize(model.name);
  const lines: string[] = [];

  lines.push(`import { z } from 'zod';`);
  lines.push("");

  const fields: string[] = [];

  if (model.props) {
    for (const [key, prop] of Object.entries(model.props)) {
      fields.push(`  ${key}: ${propKindToZod(prop)},`);
    }
  }

  // Relations: belongsTo → z.string() (foreign key id), hasMany → z.array(z.string()) (ids)
  for (const [key, rel] of relations) {
    const fieldName = relationIdField(key, rel.kind);
    const zodType =
      rel.kind === "belongsTo" ? "z.string()" : "z.array(z.string())";

    fields.push(`  ${fieldName}: ${zodType},`);
  }

  lines.push(`export const ${typeName}Schema = z.object({`);
  lines.push(...fields);
  lines.push(`});`);
  lines.push("");

  return lines.join("\n");
};
