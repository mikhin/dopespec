/** Builder — returned during model definition for chaining .when()/.prevent(). */
export type ConstraintBuilder<
  Ctx = Record<string, unknown>,
  ActionKeys extends string = string,
> = ConstraintData<Ctx, ActionKeys> & {
  /** Replaces previous prevented action (last-wins semantics). */
  prevent(actionName: ActionKeys): ConstraintBuilder<Ctx, ActionKeys>;
  /** Replaces previous guard (last-wins semantics). */
  when(fn: (ctx: Ctx) => boolean): ConstraintBuilder<Ctx, ActionKeys>;
};

/** Plain data — stored in ModelDef, consumed by codegen. No builder methods. */
export type ConstraintData<
  Ctx = Record<string, unknown>,
  ActionKeys extends string = string,
> = {
  readonly guard: ((ctx: Ctx) => boolean) | null;
  readonly kind: "constraint";
  readonly preventedAction: ActionKeys | null;
};

const createConstraintBuilder = <
  Ctx = Record<string, unknown>,
  ActionKeys extends string = string,
>(
  guard: ((ctx: Ctx) => boolean) | null,
  preventedAction: ActionKeys | null,
): ConstraintBuilder<Ctx, ActionKeys> => ({
  guard,
  kind: "constraint",
  prevent(actionName) {
    return createConstraintBuilder<Ctx, ActionKeys>(guard, actionName);
  },
  preventedAction,
  when(fn) {
    return createConstraintBuilder<Ctx, ActionKeys>(fn, preventedAction);
  },
});

export const rule = (): ConstraintBuilder =>
  createConstraintBuilder(null, null);

/** @internal Used by model() to create typed rule() factories. Phantom generics — type-level only, erased at runtime. */
export const createTypedRule =
  <Ctx, ActionKeys extends string>() =>
  (): ConstraintBuilder<Ctx, ActionKeys> =>
    createConstraintBuilder<Ctx, ActionKeys>(null, null);
