export type BooleanProp = PropDef<"boolean", null>;

export type DateProp = PropDef<"date", null>;

export type InferContext<Props extends Record<string, PropDef>> = {
  [K in keyof Props]: InferPropType<Props[K]>;
};
export type InferPropType<P> = P extends StringProp
  ? string
  : P extends NumberProp
    ? number
    : P extends BooleanProp
      ? boolean
      : P extends DateProp
        ? Date
        : P extends OneOfProp<infer T>
          ? T[number]
          : P extends LifecycleProp<infer T>
            ? T[number]
            : never;
/**
 * Lifecycle prop — defines the state machine states for a model.
 * Only lifecycle() values are valid in from().to() transitions.
 * Use oneOf() for regular enums that don't participate in transitions.
 */
export type LifecycleProp<T extends readonly string[]> = PropDef<
  "lifecycle",
  T
>;
export type NumberProp = PropDef<"number", null>;
export type OneOfProp<T extends readonly string[]> = PropDef<"oneOf", T>;

export type PropDef<K extends PropKind = PropKind, V = unknown> = {
  readonly kind: K;
  readonly values: V;
};

export type PropKind =
  | "boolean"
  | "date"
  | "lifecycle"
  | "number"
  | "oneOf"
  | "string";

export type StringProp = PropDef<"string", null>;

export const string = (): StringProp => ({ kind: "string", values: null });
export const number = (): NumberProp => ({ kind: "number", values: null });
export const boolean = (): BooleanProp => ({ kind: "boolean", values: null });
export const date = (): DateProp => ({ kind: "date", values: null });

export const oneOf = <const T extends readonly string[]>(
  values: T,
): OneOfProp<T> => ({
  kind: "oneOf",
  values,
});

export const lifecycle = <const T extends readonly string[]>(
  values: T,
): LifecycleProp<T> => ({
  kind: "lifecycle",
  values,
});
