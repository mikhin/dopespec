/**
 * A test scenario for a transition. `given` is a partial set of model props —
 * only the fields relevant to this scenario need be specified. `expected` is
 * the state the model should be in after the transition.
 */
export type Scenario<
  Ctx = Record<string, unknown>,
  States extends string = string,
> = {
  readonly expected: States;
  readonly given: Partial<Ctx>;
};

/** Builder — returned during model definition for chaining .when()/.scenario(). */
export type TransitionBuilder<
  From extends string = string,
  To extends string = string,
  Ctx = Record<string, unknown>,
  States extends string = string,
> = {
  scenario(
    given: Partial<Ctx>,
    expected: States,
  ): TransitionBuilder<From, To, Ctx, States>;
  /**
   * Replaces previous guard (last-wins semantics).
   * Guards on optional props must handle undefined values — no automatic null checks are added.
   */
  when(fn: (ctx: Ctx) => boolean): TransitionBuilder<From, To, Ctx, States>;
} & TransitionData<From, To, Ctx, States>;

/** Plain data — stored in ModelDef, consumed by codegen. No builder methods. */
export type TransitionData<
  From extends string = string,
  To extends string = string,
  Ctx = Record<string, unknown>,
  States extends string = string,
> = {
  readonly from: From;
  readonly guard: ((ctx: Ctx) => boolean) | null;
  readonly kind: "transition";
  readonly scenarios: readonly Scenario<Ctx, States>[];
  readonly to: To;
};

const createTransitionBuilder = <
  F extends string,
  T extends string,
  Ctx = Record<string, unknown>,
  States extends string = string,
>(
  fromState: F,
  toState: T,
  guard: ((ctx: Ctx) => boolean) | null,
  scenarios: readonly Scenario<Ctx, States>[],
): TransitionBuilder<F, T, Ctx, States> => ({
  from: fromState,
  guard,
  kind: "transition",
  scenario(given, expected) {
    return createTransitionBuilder<F, T, Ctx, States>(
      fromState,
      toState,
      guard,
      [...scenarios, { expected, given }],
    );
  },
  scenarios,
  to: toState,
  when(fn) {
    return createTransitionBuilder<F, T, Ctx, States>(
      fromState,
      toState,
      fn,
      scenarios,
    );
  },
});

export const from = <F extends string>(state: F) => ({
  to<T extends string>(toState: T): TransitionBuilder<F, T> {
    return createTransitionBuilder(state, toState, null, []);
  },
});

/** @internal Used by model() to create typed from() factories. Phantom generics — type-level only, erased at runtime. */
export const createTypedFrom =
  <Ctx, States extends string>() =>
  <F extends States>(state: F) => ({
    to<T extends States>(toState: T): TransitionBuilder<F, T, Ctx, States> {
      return createTransitionBuilder<F, T, Ctx, States>(
        state,
        toState,
        null,
        [],
      );
    },
  });
