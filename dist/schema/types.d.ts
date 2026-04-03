declare const MODEL_BRAND: unique symbol;
/**
 * Branded model reference — only model() outputs and ref() calls produce this type.
 * The symbol brand does not exist at runtime; it prevents arbitrary objects
 * from satisfying the type structurally.
 */
export type ModelRef = {
    readonly kind: "model";
    readonly [MODEL_BRAND]: true;
    readonly name: string;
};
/**
 * Create a forward reference to a model that hasn't been defined yet.
 * Use this when two models reference each other (circular relations).
 */
export declare const ref: (name: string) => ModelRef;
export {};
//# sourceMappingURL=types.d.ts.map