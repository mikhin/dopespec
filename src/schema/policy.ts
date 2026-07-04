import type { RelationDef } from "./relations.js";
import type { ModelRef } from "./types.js";

export type PolicyDef<Name extends string = string> = {
  readonly area?: string;
  readonly kind: "policy";
  readonly name: Name;
  readonly on: { readonly action: string; readonly model: ModelRef };
  readonly requires: Record<string, RelationDef>;
  readonly rules: readonly PolicyRule[];
};

export type PolicyRule = {
  readonly effect: "prevent" | "warn";
  /**
   * Optional satisfying context — a ctx that makes `when` return true. Supplied
   * when the generator's automatic fixture search cannot construct one (e.g. a
   * guard over embedded-collection length/contents). Used to emit a REAL policy
   * test instead of an `it.todo`. Validated at definition time: it must satisfy
   * the guard.
   */
  readonly example?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- strict TS noPropertyAccessFromIndexSignature blocks dot-access on Record types; any is required for readable guards like ctx.customer.status
  readonly when: (ctx: any) => boolean;
};

const VALID_EFFECTS = new Set(["prevent", "warn"]);

// Public overload — fully generic, provides compile-time type safety
export function policy<const Name extends string>(
  name: Name,
  config: {
    /** Optional grouping label for `dopespec map` (falls back to folder). */
    readonly area?: string;
    readonly on: { readonly action: string; readonly model: ModelRef };
    readonly requires: Record<string, RelationDef>;
    readonly rules: readonly PolicyRule[];
  },
): PolicyDef<Name>;
// Implementation — callers see the public overload's return type, not this one.
// eslint-disable-next-line padding-line-between-statements -- overload implementation must be adjacent
export function policy(name: string, config: Record<string, unknown>) {
  const trimmed = name.trim();

  if (!trimmed) throw new Error("policy() requires a non-empty name");

  const cfg = config as {
    area?: string;
    on: { action: string; model: ModelRef };
    requires: Record<string, RelationDef>;
    rules: readonly {
      effect: string;
      example?: Record<string, unknown>;
      when: unknown;
    }[];
  };

  const action = validateOn(cfg.on);

  validateRequires(cfg.requires);
  validateRules(cfg.rules);

  const result: Record<string, unknown> = {
    kind: "policy",
    name: trimmed,
    on: { action, model: cfg.on.model },
    requires: cfg.requires,
    rules: cfg.rules,
  };

  if (cfg.area !== undefined) result["area"] = cfg.area;

  return result;
}

function validateOn(on: { action: string; model: ModelRef }): string {
  if (!on || typeof on !== "object" || !on.model || on.model.kind !== "model")
    throw new Error("policy() on.model must be a model() or ref() reference");

  const action = typeof on.action === "string" ? on.action.trim() : "";

  if (!action) throw new Error("policy() on.action must be a non-empty string");

  // Validate action exists on target model (skip for ref() — model not yet defined)
  const modelActions = (on.model as Record<string, unknown>)["actions"] as
    | Record<string, unknown>
    | undefined;

  if (modelActions && !Object.keys(modelActions).includes(action))
    throw new Error(
      `policy() on.action "${action}" is not a defined action on model "${on.model.name}"`,
    );

  return action;
}

function validateRequires(
  requires: Record<string, RelationDef> | undefined,
): void {
  const keys = Object.keys(requires ?? {});

  if (keys.length === 0)
    throw new Error("policy() requires at least one entry in requires");

  for (const [key, rel] of Object.entries(requires ?? {})) {
    if (
      !rel ||
      typeof rel !== "object" ||
      (rel.kind !== "belongsTo" && rel.kind !== "hasMany")
    )
      throw new Error(
        `policy() requires["${key}"] must be a belongsTo() or hasMany() relation`,
      );
  }
}

function validateRules(
  rules:
    | readonly {
        effect: string;
        example?: Record<string, unknown>;
        when: unknown;
      }[]
    | undefined,
): void {
  if (!rules || rules.length === 0)
    throw new Error("policy() requires at least one rule");

  for (const [i, rule] of rules.entries()) {
    if (typeof rule.when !== "function")
      throw new Error(`policy() rules[${String(i)}].when must be a function`);
    if (!VALID_EFFECTS.has(rule.effect))
      throw new Error(
        `policy() rules[${String(i)}].effect must be "prevent" or "warn"`,
      );

    // A provided example must actually fire the guard — catch a stale/wrong
    // fixture at definition time rather than emitting a guaranteed-red test.
    if (rule.example !== undefined) {
      const guard = rule.when as (ctx: unknown) => unknown;
      let fires: boolean;

      try {
        fires = guard(rule.example) === true;
      } catch (error) {
        throw new Error(
          `policy() rules[${String(i)}].example threw when evaluated against the guard`,
          { cause: error },
        );
      }

      if (!fires)
        throw new Error(
          `policy() rules[${String(i)}].example does not satisfy the guard (when(example) must return true)`,
        );
    }
  }
}
