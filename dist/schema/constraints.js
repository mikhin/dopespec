const createConstraintBuilder = (guard, preventedAction) => ({
    guard,
    kind: "constraint",
    prevent(actionName) {
        return createConstraintBuilder(guard, actionName);
    },
    preventedAction,
    when(fn) {
        return createConstraintBuilder(fn, preventedAction);
    },
});
export const rule = () => createConstraintBuilder(null, null);
/** @internal Used by model() to create typed rule() factories. Phantom generics — type-level only, erased at runtime. */
export const createTypedRule = () => () => createConstraintBuilder(null, null);
//# sourceMappingURL=constraints.js.map