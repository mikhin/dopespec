/**
 * Invite authorization adapter — uses dopespec-generated policy validators
 * to enforce "Only Org Admin can resend/revoke invites".
 *
 * From member-permissions.md:
 *   | Editor         | Can Resend | Can Revoke |
 *   | Org Admin      | Yes        | Yes        |
 *   | Property Admin | No         | No         |
 *   | Dept Admin     | No         | No         |
 *
 * Usage before API calls:
 *   assertCanResendInvite({ invite, editor });   // throws if not owner
 *   assertCanRevokeInvite({ invite, editor });   // throws if not owner
 */
import type { InviteProps } from '../generated/invite.types.js';
import type {
  MemberProps,
  OnlyOwnerCanResendContext,
  OnlyOwnerCanRevokeContext,
} from '../generated/invite.policies.js';
import {
  validateOnlyOwnerCanResend,
  validateOnlyOwnerCanRevoke,
} from '../generated/invite.policies.js';

export type { MemberProps, OnlyOwnerCanResendContext, OnlyOwnerCanRevokeContext };

/**
 * Assert the editor (current user) is authorized to resend an invite.
 * Throws if editor.orgRole !== "owner".
 */
export function assertCanResendInvite(ctx: OnlyOwnerCanResendContext): void {
  const result = validateOnlyOwnerCanResend(ctx);
  if (!result.valid) {
    throw new Error(
      `Unauthorized: only Org Admin can resend invites (violations: ${result.violations.join(', ')})`,
    );
  }
}

/**
 * Assert the editor (current user) is authorized to revoke an invite.
 * Throws if editor.orgRole !== "owner".
 */
export function assertCanRevokeInvite(ctx: OnlyOwnerCanRevokeContext): void {
  const result = validateOnlyOwnerCanRevoke(ctx);
  if (!result.valid) {
    throw new Error(
      `Unauthorized: only Org Admin can revoke invites (violations: ${result.violations.join(', ')})`,
    );
  }
}
