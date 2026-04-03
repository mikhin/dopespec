const createTransitionBuilder = (fromState, toState, guard, scenarios) => ({
    from: fromState,
    guard,
    kind: "transition",
    scenario(given, expected) {
        return createTransitionBuilder(fromState, toState, guard, [...scenarios, { expected, given }]);
    },
    scenarios,
    to: toState,
    when(fn) {
        return createTransitionBuilder(fromState, toState, fn, scenarios);
    },
});
export const from = (state) => ({
    to(toState) {
        return createTransitionBuilder(state, toState, null, []);
    },
});
/** @internal Used by model() to create typed from() factories. Phantom generics — type-level only, erased at runtime. */
export const createTypedFrom = () => (state) => ({
    to(toState) {
        return createTransitionBuilder(state, toState, null, []);
    },
});
//# sourceMappingURL=transitions.js.map