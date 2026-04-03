/** Runtime brand for optional props — set by optional(), checked by isOptional(). */
const OPTIONAL_BRAND = Symbol("dopespec.optional");
export { OPTIONAL_BRAND };
/** Symbol used to store the original tuple on a StatesObject. */
const STATES_VALUES = Symbol("dopespec.states");
export const string = () => ({ kind: "string", values: null });
export const number = () => ({ kind: "number", values: null });
export const boolean = () => ({ kind: "boolean", values: null });
export const date = () => ({ kind: "date", values: null });
/** Wraps a prop as optional. Lifecycle props cannot be optional — a model always has a current state. */
export const optional = (prop) => {
    if (prop.kind === "lifecycle") {
        throw new Error("lifecycle props cannot be optional");
    }
    const result = { ...prop };
    Object.defineProperty(result, OPTIONAL_BRAND, {
        enumerable: false,
        value: true,
    });
    return result;
};
/** Check if a prop was wrapped with optional() at runtime. */
export const isOptional = (prop) => OPTIONAL_BRAND in prop && prop[OPTIONAL_BRAND];
export const oneOf = (values) => ({
    kind: "oneOf",
    values,
});
function _lifecycle(values) {
    const tuple = Array.isArray(values)
        ? values
        : values[STATES_VALUES];
    return { kind: "lifecycle", values: tuple };
}
export const lifecycle = Object.assign(_lifecycle, {
    states: (...names) => {
        const seen = new Set();
        for (const name of names) {
            if (seen.has(name)) {
                throw new Error(`lifecycle.states() received duplicate name '${name}'`);
            }
            seen.add(name);
        }
        const obj = {};
        for (const name of names)
            obj[name] = name;
        Object.defineProperty(obj, STATES_VALUES, {
            enumerable: false,
            value: names,
        });
        return Object.freeze(obj);
    },
});
//# sourceMappingURL=props.js.map