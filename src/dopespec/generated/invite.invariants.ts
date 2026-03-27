import type { InviteProps } from './invite.types.js';

export function validateCannotResendAccepted(ctx: InviteProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.status === 'accepted');
}

export function validateCannotRevokeAccepted(ctx: InviteProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.status === 'accepted');
}

export function validateCannotAcceptRevoked(ctx: InviteProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.status === 'revoked');
}

export function validateCannotAcceptExpired(ctx: InviteProps): boolean {
  // guard=true means violation, so invariant negates it
  return !(ctx.status === 'expired');
}

export function validateInvite(ctx: InviteProps): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  if (!validateCannotResendAccepted(ctx)) violations.push('cannotResendAccepted');
  if (!validateCannotRevokeAccepted(ctx)) violations.push('cannotRevokeAccepted');
  if (!validateCannotAcceptRevoked(ctx)) violations.push('cannotAcceptRevoked');
  if (!validateCannotAcceptExpired(ctx)) violations.push('cannotAcceptExpired');
  return { valid: violations.length === 0, violations };
}
