import type { InviteProps } from '../generated/invite.types.js';
import type { MemberProps } from '../generated/invite.policies.js';
import { assertCanResend, assertCanRevoke, assertCanAccept } from './invite-validation.js';
import { assertCanResendInvite, assertCanRevokeInvite } from './invite-authorization.js';
import { InviteResend, InviteRevoke, InviteAccept } from '../generated/invite.transitions.js';

export function handleInviteResend(
  ctx: InviteProps,
  _payload: { organizationId: string; inviteId: string },
  editor: MemberProps,
): InviteProps {
  // 1. Invariant: cannot resend accepted invite
  assertCanResend(ctx);
  // 2. Policy: only Org Admin can resend
  assertCanResendInvite({ invite: ctx, editor });
  // 3. Transition: apply state change
  return InviteResend(ctx);
}

export function handleInviteRevoke(
  ctx: InviteProps,
  _payload: { organizationId: string; inviteId: string },
  editor: MemberProps,
): InviteProps {
  // 1. Invariant: cannot revoke accepted invite
  assertCanRevoke(ctx);
  // 2. Policy: only Org Admin can revoke
  assertCanRevokeInvite({ invite: ctx, editor });
  // 3. Transition: apply state change
  return InviteRevoke(ctx);
}

export function handleInviteAccept(
  ctx: InviteProps,
  _payload: { token: string },
): InviteProps {
  // 1. Invariant: cannot accept revoked or expired invite
  assertCanAccept(ctx);
  // 2. Transition: apply state change
  return InviteAccept(ctx);
}
