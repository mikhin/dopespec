import type { ModelRef } from "./types.js";

export type RelationDef<K extends RelationKind = RelationKind> = {
  readonly kind: K;
  readonly target: ModelRef;
};

export type RelationKind = "belongsTo" | "hasMany";

export const hasMany = (target: ModelRef): RelationDef<"hasMany"> => ({
  kind: "hasMany",
  target,
});

export const belongsTo = (target: ModelRef): RelationDef<"belongsTo"> => ({
  kind: "belongsTo",
  target,
});
