export type InviteUiVisibilityInput = {
  inviteStatus: 'pending' | 'accepted' | 'revoked' | 'expired';
  canManageInvites: boolean;
};

export type InviteUiVisibilityOutput = {
  isVisible: boolean;
  showResend: boolean;
  showRevoke: boolean;
};

/** Evaluate rules top-to-bottom, return first match. */
export function evaluateInviteUiVisibility(input: InviteUiVisibilityInput): InviteUiVisibilityOutput {
  if (input.inviteStatus === 'pending' && input.canManageInvites === true) return { isVisible: true, showResend: true, showRevoke: true };
  if (input.inviteStatus === 'revoked' && input.canManageInvites === true) return { isVisible: true, showResend: true, showRevoke: false };
  return { isVisible: false, showResend: false, showRevoke: false };
}
