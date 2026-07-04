import type { RelationDef } from "./relations.js";
import type { ModelRef } from "./types.js";
export type PolicyDef<Name extends string = string> = {
    readonly area?: string;
    readonly kind: "policy";
    readonly name: Name;
    readonly on: {
        readonly action: string;
        readonly model: ModelRef;
    };
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
    readonly when: (ctx: any) => boolean;
};
export declare function policy<const Name extends string>(name: Name, config: {
    /** Optional grouping label for `dopespec map` (falls back to folder). */
    readonly area?: string;
    readonly on: {
        readonly action: string;
        readonly model: ModelRef;
    };
    readonly requires: Record<string, RelationDef>;
    readonly rules: readonly PolicyRule[];
}): PolicyDef<Name>;
//# sourceMappingURL=policy.d.ts.map