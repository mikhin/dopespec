export const hasMany = (target) => ({
    kind: "hasMany",
    target,
});
export const belongsTo = (target) => ({
    kind: "belongsTo",
    target,
});
/**
 * Embedded child collection — the child's props nest inline as an array
 * (`key: ChildProps[]`) instead of normalized id refs. For denormalized
 * aggregates / tree structures; recurses through the child's own embeds.
 */
export const embeds = (target) => ({
    kind: "embeds",
    target,
});
//# sourceMappingURL=relations.js.map