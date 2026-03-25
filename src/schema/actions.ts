import type {
  BooleanProp,
  DateProp,
  NumberProp,
  PropDef,
  StringProp,
} from "./props.js";

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
type FieldsOf<P> = { [K in keyof P]: PropDefFor<P[K]> };

/**
 * Maps a TypeScript type to the corresponding PropDef variant.
 * Used by FieldsOf to enforce compile-time validation between Payload and fields.
 */
type PropDefFor<T> = T extends string
  ? StringProp
  : T extends number
    ? NumberProp
    : T extends boolean
      ? BooleanProp
      : T extends Date
        ? DateProp
        : PropDef;

const VALID_PROP_KINDS = new Set([
  "boolean",
  "date",
  "lifecycle",
  "number",
  "oneOf",
  "string",
]);

const validateFields = (fields: Record<string, PropDef>): void => {
  for (const [key, value] of Object.entries(fields)) {
    if (
      !value ||
      typeof value !== "object" ||
      !VALID_PROP_KINDS.has(value.kind)
    ) {
      throw new Error(
        `action() field "${key}" must be a PropDef (string(), number(), etc.). ` +
          `Got: ${JSON.stringify(value)}`,
      );
    }
  }
};

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
export const action = <Payload = unknown>(
  fields?: unknown extends Payload
    ? Record<string, PropDef>
    : FieldsOf<Payload>,
): ActionDef<Payload> => {
  if (fields) {
    validateFields(fields as Record<string, PropDef>);
  }

  return (
    fields ? { fields, kind: "action" } : { kind: "action" }
  ) as ActionDef<Payload>;
};
