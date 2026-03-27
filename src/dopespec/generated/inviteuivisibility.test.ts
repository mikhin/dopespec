import { describe, it, expect } from 'vitest';
import { evaluateInviteUiVisibility } from './inviteuivisibility.evaluate.js';

describe('InviteUiVisibility', () => {
  it('when inviteStatus = "pending", canManageInvites = true, then isVisible = true, showResend = true, showRevoke = true', () => {
    const result = evaluateInviteUiVisibility({ inviteStatus: 'pending', canManageInvites: true });
    expect(result).toEqual({ isVisible: true, showResend: true, showRevoke: true });
  });

  it('when inviteStatus = "revoked", canManageInvites = true, then isVisible = true, showResend = true, showRevoke = false', () => {
    const result = evaluateInviteUiVisibility({ inviteStatus: 'revoked', canManageInvites: true });
    expect(result).toEqual({ isVisible: true, showResend: true, showRevoke: false });
  });

  it('default (no conditions), then isVisible = false, showResend = false, showRevoke = false', () => {
    const result = evaluateInviteUiVisibility({ inviteStatus: 'pending', canManageInvites: false });
    expect(result).toEqual({ isVisible: false, showResend: false, showRevoke: false });
  });

});
