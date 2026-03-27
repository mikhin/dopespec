import { describe, it, expect } from 'vitest';
import { validateOnlyOwnerCanResend, validateOnlyOwnerCanRevoke } from './invite.policies.js';
import type { OnlyOwnerCanResendContext, OnlyOwnerCanRevokeContext } from './invite.policies.js';

describe('OnlyOwnerCanResend', () => {
  it('OnlyOwnerCanResend:rule_0: ctx.editor.orgRole!=="owner" → prevent', () => {
    const ctx = {
      invite: {},
      editor: {},
    };
    const result = validateOnlyOwnerCanResend(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('OnlyOwnerCanResend:rule_0');
  });
});

describe('OnlyOwnerCanRevoke', () => {
  it('OnlyOwnerCanRevoke:rule_0: ctx.editor.orgRole!=="owner" → prevent', () => {
    const ctx = {
      invite: {},
      editor: {},
    };
    const result = validateOnlyOwnerCanRevoke(ctx);
    expect(result.valid).toBe(false);
    expect(result.violations).toContain('OnlyOwnerCanRevoke:rule_0');
  });
});
