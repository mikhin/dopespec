declare const ACTION_PAYLOAD: unique symbol;

/**
 * Typed action definition. The Payload generic is carried at compile time
 * via a phantom symbol brand — codegen extracts it to generate command types.
 * The symbol property does not exist at runtime.
 */
export type ActionDef<Payload = unknown> = {
  readonly [ACTION_PAYLOAD]: Payload;
  readonly kind: "action";
};

export const action = <Payload = unknown>(): ActionDef<Payload> =>
  ({ kind: "action" }) as ActionDef<Payload>;
