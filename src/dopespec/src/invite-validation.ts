/**
 * Invite validation adapter — uses dopespec-generated invariants and types
 * to replace hand-written status checks scattered across the codebase.
 *
 * Instead of:
 *   if (invite.status === "accepted") throw new Error("Cannot resend accepted invite");
 *
 * Use:
 *   assertCanResend(invite);        // throws with violation name
 *   assertCanRevoke(invite);        // throws with violation name
 *   assertCanAccept(invite);        // throws with violation name
 *   validateInviteAction(invite);   // returns { valid, violations } without throwing
 */
import type { InviteProps, InviteStatus } from '../generated/invite.types.js';
import {
  validateCannotResendAccepted,
  validateCannotRevokeAccepted,
  validateCannotAcceptRevoked,
  validateCannotAcceptExpired,
  validateInvite,
} from '../generated/invite.invariants.js';

// Re-export types for consumers
export type { InviteProps, InviteStatus } from '../generated/invite.types.js';

/**
 * Assert invite can be resent. Throws if status is 'accepted'.
 */
export function assertCanResend(invite: InviteProps): void {
  if (!validateCannotResendAccepted(invite)) {
    throw new Error(
      `Cannot resend invite ${invite.id}: status is '${invite.status}' (violation: cannotResendAccepted)`,
    );
  }
}

/**
 * Assert invite can be revoked. Throws if status is 'accepted'.
 */
export function assertCanRevoke(invite: InviteProps): void {
  if (!validateCannotRevokeAccepted(invite)) {
    throw new Error(
      `Cannot revoke invite ${invite.id}: status is '${invite.status}' (violation: cannotRevokeAccepted)`,
    );
  }
}

/**
 * Assert invite can be accepted. Throws if status is 'revoked' or 'expired'.
 */
export function assertCanAccept(invite: InviteProps): void {
  if (!validateCannotAcceptRevoked(invite)) {
    throw new Error(
      `Cannot accept invite ${invite.id}: status is '${invite.status}' (violation: cannotAcceptRevoked)`,
    );
  }
  if (!validateCannotAcceptExpired(invite)) {
    throw new Error(
      `Cannot accept invite ${invite.id}: status is '${invite.status}' (violation: cannotAcceptExpired)`,
    );
  }
}

/**
 * Validate all invite invariants at once. Returns { valid, violations }.
 * Does not throw — caller decides how to handle.
 */
export { validateInvite as validateInviteAction } from '../generated/invite.invariants.js';
