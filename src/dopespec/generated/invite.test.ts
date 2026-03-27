import { describe, it, expect } from 'vitest';
import type { InviteProps } from './invite.types.js';
import { InviteAccept, InviteRevoke, InviteResend, InviteResendAfterRevoke, InviteExpire, InviteResendAfterExpired } from './invite.transitions.js';

describe('Invite', () => {
  it('given {"email":"bob@alpha.com"}, when accept, then status = accepted', () => {
    const ctx = { id: '', email: 'bob@alpha.com', createdAt: new Date(0), expiresAt: new Date(0), status: 'pending', organizationId: '', memberId: '' } satisfies InviteProps;
    const result = InviteAccept(ctx);
    expect(result.status).toBe('accepted');
  });

  it('given {"email":"bob@alpha.com"}, when revoke, then status = revoked', () => {
    const ctx = { id: '', email: 'bob@alpha.com', createdAt: new Date(0), expiresAt: new Date(0), status: 'pending', organizationId: '', memberId: '' } satisfies InviteProps;
    const result = InviteRevoke(ctx);
    expect(result.status).toBe('revoked');
  });

  it('given {"email":"bob@alpha.com"}, when resend, then status = pending', () => {
    const ctx = { id: '', email: 'bob@alpha.com', createdAt: new Date(0), expiresAt: new Date(0), status: 'pending', organizationId: '', memberId: '' } satisfies InviteProps;
    const result = InviteResend(ctx);
    expect(result.status).toBe('pending');
  });

  it('given {"email":"bob@alpha.com"}, when resendAfterRevoke, then status = pending', () => {
    const ctx = { id: '', email: 'bob@alpha.com', createdAt: new Date(0), expiresAt: new Date(0), status: 'revoked', organizationId: '', memberId: '' } satisfies InviteProps;
    const result = InviteResendAfterRevoke(ctx);
    expect(result.status).toBe('pending');
  });

  it('given {"email":"bob@alpha.com"}, when expire, then status = expired', () => {
    const ctx = { id: '', email: 'bob@alpha.com', createdAt: new Date(0), expiresAt: new Date(0), status: 'pending', organizationId: '', memberId: '' } satisfies InviteProps;
    const result = InviteExpire(ctx);
    expect(result.status).toBe('expired');
  });

  it('given {"email":"bob@alpha.com"}, when resendAfterExpired, then status = pending', () => {
    const ctx = { id: '', email: 'bob@alpha.com', createdAt: new Date(0), expiresAt: new Date(0), status: 'expired', organizationId: '', memberId: '' } satisfies InviteProps;
    const result = InviteResendAfterExpired(ctx);
    expect(result.status).toBe('pending');
  });

});
