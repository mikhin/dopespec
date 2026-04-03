const VALID_PROP_KINDS = new Set([
    "boolean",
    "date",
    "lifecycle",
    "number",
    "oneOf",
    "string",
]);
const validateFields = (fields) => {
    for (const [key, value] of Object.entries(fields)) {
        if (!value ||
            typeof value !== "object" ||
            !VALID_PROP_KINDS.has(value.kind)) {
            throw new Error(`action() field "${key}" must be a PropDef (string(), number(), etc.). ` +
                `Got: ${JSON.stringify(value)}`);
        }
    }
};
/**
 * Create a typed action definition with optional runtime payload metadata.
 *
 * When Payload is specified, fields are compile-time validated to match:
 *   action<{ name: string }>({ name: string() })  // OK
 *   action<{ name: string }>({ name: number() })  // compile error
 *   action<{ name: string }>({ wrong: string() }) // compile error
 *
 * Fields are also runtime-validated to ensure each value is a valid PropDef.
 */
export const action = (fields) => {
    if (fields) {
        validateFields(fields);
    }
    return (fields ? { fields, kind: "action" } : { kind: "action" });
};
//# sourceMappingURL=actions.js.map