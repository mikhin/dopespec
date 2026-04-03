import type { ModelDef } from "../schema/model.js";
/**
 * Generate domain event types from a model's transitions.
 * Generated code references ${Model}Props — expects types from ./${modelName}.types
 * to be available (either concatenated or imported).
 */
export declare const generateEvents: (model: ModelDef) => string;
//# sourceMappingURL=events.d.ts.map