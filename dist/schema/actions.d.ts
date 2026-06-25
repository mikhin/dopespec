import type { BooleanProp, DateProp, NumberProp, OneOfProp, PropDef, StringProp } from "./props.js";
declare const ACTION_PAYLOAD: unique symbol;
/**
 * Typed action definition. The Payload generic is carried at compile time
 * via a phantom symbol brand — codegen extracts it to generate command types.
 * The optional `fields` property carries payload metadata at runtime for codegen.
 */
export type ActionDef<Payload = unknown> = {
    readonly [ACTION_PAYLOAD]: Payload;
    readonly fields?: Record<string, PropDef>;
    readonly kind: "action";
};
/**
 * Maps a Payload type to a record of PropDef fields, enforcing that
 * each key in Payload has the correctly-typed PropDef descriptor.
 */
type FieldsOf<P> = {
    [K in keyof P]: PropDefFor<P[K]>;
};
/**
 * Maps a TypeScript type to the corresponding PropDef variant.
 * Used by FieldsOf to enforce compile-time validation between Payload and fields.
 *
 * A *literal* union of strings (e.g. `'left' | 'right'`) or numbers (e.g.
 * `1 | 2 | 3`) accepts a matching `oneOf([...])` as well as the scalar `string()`
 * / `number()`. `oneOf` is preferred because the union then survives into the
 * generated command types instead of widening to `string` / `number`; the scalar
 * stays valid for backwards compatibility. The wide `string` / `number` types only
 * accept the scalar. The `[T]` tuple wrappers stop the conditional from
 * distributing over the union, so a single `OneOfProp<readonly ('left'|'right')[]>`
 * is produced rather than one per member.
 */
type PropDefFor<T> = [T] extends [string] ? [string] extends [T] ? StringProp : OneOfProp<readonly T[]> | StringProp : [T] extends [number] ? [number] extends [T] ? NumberProp : NumberProp | OneOfProp<readonly T[]> : [T] extends [boolean] ? BooleanProp : [T] extends [Date] ? DateProp : PropDef;
/**
 * Create a typed action definition with optional runtime payload metadata.
 *
 * When Payload is specified, fields are compile-time validated to match:
 *   action<{ name: string }>({ name: string() })  // OK
 *   action<{ name: string }>({ name: number() })  // compile error
 *   action<{ name: string }>({ wrong: string() }) // compile error
 *
 * Fields are also runtime-validated to ensure each value is a valid PropDef.
 */
export declare const action: <Payload = unknown>(fields?: unknown extends Payload ? Record<string, PropDef> : FieldsOf<Payload>) => ActionDef<Payload>;
export {};
//# sourceMappingURL=actions.d.ts.map