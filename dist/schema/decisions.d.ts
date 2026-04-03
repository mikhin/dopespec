import type { InferPropType, PropDef } from "./props.js";
export type DecisionDef<Name extends string = string, I extends Record<string, PropDef> = Record<string, PropDef>, O extends Record<string, PropDef> = Record<string, PropDef>> = {
    readonly inputs: I;
    readonly kind: "decision";
    readonly name: Name;
    readonly outputs: O;
    readonly rules: readonly DecisionRule<I, O>[];
};
export type DecisionRule<I extends Record<string, PropDef> = Record<string, PropDef>, O extends Record<string, PropDef> = Record<string, PropDef>> = {
    readonly then: InferValues<O>;
    readonly when: Partial<InferValues<I>>;
};
/**
 * Maps a PropDef record to a plain value record.
 * Unlike InferContext, does not handle optional — decision inputs/outputs are always required.
 */
type InferValues<P extends Record<string, PropDef>> = InferValuesRaw<P> extends infer T ? {
    [K in keyof T]: T[K];
} & {} : never;
type InferValuesRaw<P extends Record<string, PropDef>> = {
    [K in keyof P]: InferPropType<P[K]>;
};
export declare function decisions<const Name extends string, const I extends Record<string, PropDef>, const O extends Record<string, PropDef>>(name: Name, config: {
    readonly inputs: I;
    readonly outputs: O;
    readonly rules: readonly DecisionRule<I, O>[];
}): DecisionDef<Name, I, O>;
export {};
//# sourceMappingURL=decisions.d.ts.map