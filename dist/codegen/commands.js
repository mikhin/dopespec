import { capitalize, fieldsToTSType, getActions } from "./utils.js";
/** Generate command types from a model's actions. */
export const generateCommands = (model) => {
    const actions = getActions(model);
    if (actions.length === 0)
        return "";
    const typeName = capitalize(model.name);
    const lines = [];
    const commandTypeNames = [];
    for (const [name, actionDef] of actions) {
        const commandName = `${typeName}${capitalize(name)}Command`;
        commandTypeNames.push(commandName);
        const payloadType = fieldsToTSType(actionDef.fields);
        lines.push(`export type ${commandName} = {`);
        lines.push(`  type: '${typeName}${capitalize(name)}';`);
        lines.push(`  payload: ${payloadType};`);
        lines.push(`};`);
        lines.push("");
    }
    // Union type
    lines.push(`export type ${typeName}Command = ${commandTypeNames.join(" | ")};`);
    lines.push("");
    return lines.join("\n");
};
//# sourceMappingURL=commands.js.map