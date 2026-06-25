import type { ModelRef } from "./types.js";

export type RelationDef<K extends RelationKind = RelationKind> = {
  readonly kind: K;
  readonly target: ModelRef;
};

export type RelationKind = "belongsTo" | "embeds" | "hasMany";

export const hasMany = (target: ModelRef): RelationDef<"hasMany"> => ({
  kind: "hasMany",
  target,
});

export const belongsTo = (target: ModelRef): RelationDef<"belongsTo"> => ({
  kind: "belongsTo",
  target,
});

/**
 * Embedded child collection — the child's props nest inline as an array
 * (`key: ChildProps[]`) instead of normalized id refs. For denormalized
 * aggregates / tree structures; recurses through the child's own embeds.
 */
export const embeds = (target: ModelRef): RelationDef<"embeds"> => ({
  kind: "embeds",
  target,
});
