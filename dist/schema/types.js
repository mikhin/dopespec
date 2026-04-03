/**
 * Create a forward reference to a model that hasn't been defined yet.
 * Use this when two models reference each other (circular relations).
 */
export const ref = (name) => {
    const trimmed = name.trim();
    if (!trimmed)
        throw new Error("ref() requires a non-empty model name");
    return { kind: "model", name: trimmed };
};
//# sourceMappingURL=types.js.map