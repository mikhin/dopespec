import type { PetProps } from "./pet.types.js";

export function validateNicknameTooLong(ctx: PetProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.nickname !== void 0 && ctx.nickname.length > 20);
}

export function validatePet(ctx: PetProps): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  if (!validateNicknameTooLong(ctx)) violations.push("nicknameTooLong");
  return { valid: violations.length === 0, violations };
}
