export type BooleanProp = PropDef<"boolean", null>;
export type DateProp = PropDef<"date", null>;
export type InferContext<Props extends Record<string, PropDef>> = InferContextRaw<Props> extends infer T ? {
    [K in keyof T]: T[K];
} & {} : never;
export type InferPropType<P> = P extends StringProp ? string : P extends NumberProp ? number : P extends BooleanProp ? boolean : P extends DateProp ? Date : P extends OneOfProp<infer T> ? T[number] : P extends LifecycleProp<infer T> ? T[number] : never;
/**
 * Lifecycle prop — defines the state machine states for a model.
 * Only lifecycle() values are valid in from().to() transitions.
 * Use oneOf() for regular enums that don't participate in transitions.
 */
export type LifecycleProp<T extends readonly string[]> = PropDef<"lifecycle", T>;
export type NumberProp = PropDef<"number", null>;
export type OneOfProp<T extends readonly string[]> = PropDef<"oneOf", T>;
export type PropDef<K extends PropKind = PropKind, V = unknown> = {
    readonly kind: K;
    readonly values: V;
};
export type PropKind = "boolean" | "date" | "lifecycle" | "number" | "oneOf" | "string";
export type StringProp = PropDef<"string", null>;
type InferContextRaw<Props extends Record<string, PropDef>> = {
    [K in keyof Props as Props[K] extends OptionalPropDef ? K : never]?: InferPropType<Props[K]>;
} & {
    [K in keyof Props as Props[K] extends OptionalPropDef ? never : K]: InferPropType<Props[K]>;
};
/** Runtime brand for optional props — set by optional(), checked by isOptional(). */
declare const OPTIONAL_BRAND: unique symbol;
export { OPTIONAL_BRAND };
/** Symbol used to store the original tuple on a StatesObject. */
declare const STATES_VALUES: unique symbol;
/** Phantom brand — type-level only, prevents structural spoofing. Same pattern as ModelRef. */
declare const STATES_BRAND: unique symbol;
/** Object returned by lifecycle.states() — named keys mapping to themselves, plus a hidden tuple. */
export type StatesObject<T extends readonly string[]> = {
    readonly [K in T[number]]: K;
} & {
    readonly [STATES_BRAND]: true;
    readonly [STATES_VALUES]: T;
};
export declare const string: () => StringProp;
export declare const number: () => NumberProp;
export declare const boolean: () => BooleanProp;
export declare const date: () => DateProp;
export type OptionalPropDef<P extends PropDef = PropDef> = P & {
    readonly [OPTIONAL_BRAND]: true;
};
/** Wraps a prop as optional. Lifecycle props cannot be optional — a model always has a current state. */
export declare const optional: <P extends PropDef>(prop: P & (P extends LifecycleProp<readonly string[]> ? never : P)) => OptionalPropDef<P>;
/** Check if a prop was wrapped with optional() at runtime. */
export declare const isOptional: (prop: PropDef) => prop is OptionalPropDef;
export declare const oneOf: <const T extends readonly string[]>(values: T) => OneOfProp<T>;
declare function _lifecycle<const T extends readonly string[]>(values: StatesObject<T>): LifecycleProp<T>;
declare function _lifecycle<const T extends readonly string[]>(values: T): LifecycleProp<T>;
export declare const lifecycle: typeof _lifecycle & {
    states: <const T extends readonly string[]>(...names: T) => StatesObject<T>;
};
//# sourceMappingURL=props.d.ts.map