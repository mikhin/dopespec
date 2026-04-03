/** Builder — returned during model definition for chaining .when()/.prevent(). */
export type ConstraintBuilder<Ctx = Record<string, unknown>, ActionKeys extends string = string> = {
    /** Replaces previous prevented action (last-wins semantics). */
    prevent(actionName: ActionKeys): ConstraintBuilder<Ctx, ActionKeys>;
    /**
     * Replaces previous guard (last-wins semantics).
     * Guards on optional props must handle undefined values — no automatic null checks are added.
     */
    when(fn: (ctx: Ctx) => boolean): ConstraintBuilder<Ctx, ActionKeys>;
} & ConstraintData<Ctx, ActionKeys>;
/** Plain data — stored in ModelDef, consumed by codegen. No builder methods. */
export type ConstraintData<Ctx = Record<string, unknown>, ActionKeys extends string = string> = {
    readonly guard: ((ctx: Ctx) => boolean) | null;
    readonly kind: "constraint";
    readonly preventedAction: ActionKeys | null;
};
export declare const rule: () => ConstraintBuilder;
/** @internal Used by model() to create typed rule() factories. Phantom generics — type-level only, erased at runtime. */
export declare const createTypedRule: <Ctx, ActionKeys extends string>() => () => ConstraintBuilder<Ctx, ActionKeys>;
//# sourceMappingURL=constraints.d.ts.map