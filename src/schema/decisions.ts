import type { InferPropType, PropDef } from "./props.js";

import { isOptional } from "./props.js";

export type DecisionDef<
  Name extends string = string,
  I extends Record<string, PropDef> = Record<string, PropDef>,
  O extends Record<string, PropDef> = Record<string, PropDef>,
> = {
  readonly inputs: I;
  readonly kind: "decision";
  readonly name: Name;
  readonly outputs: O;
  readonly rules: readonly DecisionRule<I, O>[];
};

export type DecisionRule<
  I extends Record<string, PropDef> = Record<string, PropDef>,
  O extends Record<string, PropDef> = Record<string, PropDef>,
> = {
  readonly then: InferValues<O>;
  readonly when: Partial<InferValues<I>>;
};

/**
 * Maps a PropDef record to a plain value record.
 * Unlike InferContext, does not handle optional — decision inputs/outputs are always required.
 */
type InferValues<P extends Record<string, PropDef>> =
  InferValuesRaw<P> extends infer T ? { [K in keyof T]: T[K] } & {} : never;

type InferValuesRaw<P extends Record<string, PropDef>> = {
  [K in keyof P]: InferPropType<P[K]>;
};

const validateProp = (
  key: string,
  prop: PropDef,
  label: "input" | "output",
): void => {
  if (prop.kind === "lifecycle")
    throw new Error(
      `decisions() ${label} "${key}" cannot be a lifecycle prop — use oneOf() instead`,
    );
  if (isOptional(prop))
    throw new Error(
      `decisions() ${label} "${key}" cannot be optional — all ${label}s are required`,
    );
};

const validateRuleWhen = (
  rule: { when: Record<string, unknown> },
  index: number,
  inputKeys: string[],
): void => {
  for (const key of Object.keys(rule.when)) {
    if (!inputKeys.includes(key))
      throw new Error(
        `decisions() rule[${String(index)}].when key "${key}" is not a defined input`,
      );
  }
};

const validateRuleThen = (
  rule: { then: Record<string, unknown> },
  index: number,
  outputKeys: string[],
): void => {
  const thenKeys = Object.keys(rule.then);

  for (const key of thenKeys) {
    if (!outputKeys.includes(key))
      throw new Error(
        `decisions() rule[${String(index)}].then key "${key}" is not a defined output`,
      );
  }

  for (const key of outputKeys) {
    if (!thenKeys.includes(key))
      throw new Error(
        `decisions() rule[${String(index)}].then is missing output key "${key}"`,
      );
  }
};

// Public overload — fully generic, provides compile-time type safety
export function decisions<
  const Name extends string,
  const I extends Record<string, PropDef>,
  const O extends Record<string, PropDef>,
>(
  name: Name,
  config: {
    readonly inputs: I;
    readonly outputs: O;
    readonly rules: readonly DecisionRule<I, O>[];
  },
): DecisionDef<Name, I, O>;
// Implementation — callers see the public overload's return type, not this one.
// eslint-disable-next-line padding-line-between-statements -- overload implementation must be adjacent
export function decisions(name: string, config: Record<string, unknown>) {
  const trimmed = name.trim();

  if (!trimmed) throw new Error("decisions() requires a non-empty name");

  const cfg = config as {
    inputs: Record<string, PropDef>;
    outputs: Record<string, PropDef>;
    rules: readonly {
      then: Record<string, unknown>;
      when: Record<string, unknown>;
    }[];
  };

  const inputKeys = Object.keys(cfg.inputs);
  const outputKeys = Object.keys(cfg.outputs);

  if (inputKeys.length === 0)
    throw new Error("decisions() requires at least one input");
  if (outputKeys.length === 0)
    throw new Error("decisions() requires at least one output");
  if (!cfg.rules || cfg.rules.length === 0)
    throw new Error("decisions() requires at least one rule");

  for (const [key, prop] of Object.entries(cfg.inputs))
    validateProp(key, prop, "input");
  for (const [key, prop] of Object.entries(cfg.outputs))
    validateProp(key, prop, "output");

  for (const [i, rule] of cfg.rules.entries()) {
    validateRuleWhen(rule, i, inputKeys);
    validateRuleThen(rule, i, outputKeys);
  }

  return {
    inputs: cfg.inputs,
    kind: "decision" as const,
    name: trimmed,
    outputs: cfg.outputs,
    rules: cfg.rules,
  };
}
