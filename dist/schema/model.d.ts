import type { ActionDef } from "./actions.js";
import type { ConstraintBuilder, ConstraintData } from "./constraints.js";
import type { InferContext, LifecycleProp, PropDef } from "./props.js";
import type { RelationDef } from "./relations.js";
import type { TransitionBuilder, TransitionData } from "./transitions.js";
import type { ModelRef } from "./types.js";
export type ConstraintHelpers<Ctx, ActionKeys extends string> = {
    rule: () => ConstraintBuilder<Ctx, ActionKeys>;
};
export type ModelDef<Name extends string = string, P extends Record<string, PropDef> = Record<string, PropDef>, A extends Record<string, ActionDef> = Record<string, ActionDef>, R extends Record<string, RelationDef> = Record<string, RelationDef>, T extends Record<string, TransitionDefBase> = Record<string, TransitionDefBase>, C extends Record<string, ConstraintDefBase> = Record<string, ConstraintDefBase>> = IfProvided<"actions", A> & IfProvided<"constraints", StripConstraintMethods<C>> & IfProvided<"props", P> & IfProvided<"relations", R> & IfProvided<"transitions", StripTransitionMethods<T>> & ModelRef & {
    readonly name: Name;
};
/**
 * Extracts the state union from lifecycle() props only (not oneOf).
 * Returns `never` if zero or multiple lifecycle() props exist — only one allowed per model.
 */
export type StatesOf<P extends Record<string, PropDef>> = IsUnion<LifecycleKeys<P>> extends true ? never : string & {
    [K in keyof P]: P[K] extends LifecycleProp<infer T> ? T[number] : never;
}[keyof P];
export type TransitionHelpers<Ctx, States extends string> = {
    from: <F extends States>(state: F) => {
        to: <T extends States>(toState: T) => TransitionBuilder<F, T, Ctx, States>;
    };
};
type ConstraintDefBase = {
    readonly kind: "constraint";
};
/**
 * Makes field K required when V has concrete keys (user-provided),
 * optional when V has a string index signature (unparameterized default).
 * Depends on ModelDef defaults being Record<string, …> and model() defaults
 * being Record<string, never> — both have `string` as keyof.
 */
type IfProvided<K extends string, V> = string extends keyof V ? {
    readonly [k in K]?: V;
} : {
    readonly [k in K]: V;
};
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;
type LifecycleKeys<P extends Record<string, PropDef>> = {
    [K in keyof P]: P[K] extends LifecycleProp<readonly string[]> ? K : never;
}[keyof P];
type StripConstraintMethods<C extends Record<string, ConstraintDefBase>> = {
    readonly [K in keyof C]: ToConstraintData<C[K]>;
};
type StripTransitionMethods<T extends Record<string, TransitionDefBase>> = {
    readonly [K in keyof T]: ToTransitionData<T[K]>;
};
type ToConstraintData<T> = T extends ConstraintBuilder<infer Ctx, infer A> ? ConstraintData<Ctx, A> : T extends ConstraintData<infer Ctx, infer A> ? ConstraintData<Ctx, A> : T;
type ToTransitionData<T> = T extends TransitionBuilder<infer F, infer To, infer Ctx, infer S> ? TransitionData<F, To, Ctx, S> : T extends TransitionData<infer F, infer To, infer Ctx, infer S> ? TransitionData<F, To, Ctx, S> : T;
type TransitionDefBase = {
    readonly from: string;
    readonly kind: "transition";
    readonly to: string;
};
type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export declare function model<const Name extends string, const P extends Record<string, PropDef> = Record<string, never>, const A extends Record<string, ActionDef> = Record<string, never>, const R extends Record<string, RelationDef> = Record<string, never>, T extends Record<string, TransitionDefBase> = Record<string, never>, C extends Record<string, ConstraintDefBase> = Record<string, never>>(name: Name, config: {
    readonly actions?: A;
    readonly constraints?: (helpers: ConstraintHelpers<InferContext<P>, Extract<keyof A, string>>) => C;
    readonly props?: P;
    readonly relations?: R;
    readonly transitions?: (helpers: TransitionHelpers<InferContext<P>, StatesOf<P>>) => T;
}): ModelDef<Name, P, A, R, T, C>;
export {};
//# sourceMappingURL=model.d.ts.map