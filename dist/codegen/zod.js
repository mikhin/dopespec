import { isOptional } from "../schema/props.js";
import { capitalize, getRelations, propKindToZod, relationIdField, toKebabCase, } from "./utils.js";
/** Generate Zod validation schema from a model's props and relations. Targets Zod v3.x / v4.x (z.object, z.enum). */
export const generateZod = (model) => {
    const hasProps = model.props && Object.keys(model.props).length > 0;
    const relations = getRelations(model);
    if (!hasProps && relations.length === 0)
        return "";
    const typeName = capitalize(model.name);
    const fields = [];
    const imports = new Set();
    if (model.props) {
        for (const [key, prop] of Object.entries(model.props)) {
            const zodType = propKindToZod(prop) + (isOptional(prop) ? ".optional()" : "");
            fields.push(`  ${key}: ${zodType},`);
        }
    }
    fields.push(...relationZodFields(relations, imports));
    const lines = [`import { z } from 'zod';`];
    if (imports.size > 0)
        lines.push(...[...imports].sort());
    lines.push("");
    lines.push(`export const ${typeName}Schema = z.object({`);
    lines.push(...fields);
    lines.push(`});`);
    lines.push("");
    return lines.join("\n");
};
/** Relation fields for a Zod schema; collects child-schema imports for embeds. */
function relationZodFields(relations, imports) {
    return relations.map(([key, rel]) => {
        if (rel.kind === "embeds") {
            const childSchema = `${capitalize(rel.target.name)}Schema`;
            imports.add(`import { ${childSchema} } from './${toKebabCase(rel.target.name)}.zod.js';`);
            return `  ${key}: z.array(${childSchema}),`;
        }
        const fieldName = relationIdField(key, rel.kind);
        const zodType = rel.kind === "belongsTo" ? "z.string()" : "z.array(z.string())";
        return `  ${fieldName}: ${zodType},`;
    });
}
//# sourceMappingURL=zod.js.map