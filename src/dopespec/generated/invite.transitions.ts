import type { InviteProps } from './invite.types.js';

export function InviteAccept(ctx: InviteProps): InviteProps {
  if (ctx.status !== 'pending') {
    throw new Error(`Cannot accept: expected status 'pending', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'accepted' };
}

export function InviteRevoke(ctx: InviteProps): InviteProps {
  if (ctx.status !== 'pending') {
    throw new Error(`Cannot revoke: expected status 'pending', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'revoked' };
}

export function InviteResend(ctx: InviteProps): InviteProps {
  if (ctx.status !== 'pending') {
    throw new Error(`Cannot resend: expected status 'pending', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'pending' };
}

export function InviteResendAfterRevoke(ctx: InviteProps): InviteProps {
  if (ctx.status !== 'revoked') {
    throw new Error(`Cannot resendAfterRevoke: expected status 'revoked', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'pending' };
}

export function InviteExpire(ctx: InviteProps): InviteProps {
  if (ctx.status !== 'pending') {
    throw new Error(`Cannot expire: expected status 'pending', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'expired' };
}

export function InviteResendAfterExpired(ctx: InviteProps): InviteProps {
  if (ctx.status !== 'expired') {
    throw new Error(`Cannot resendAfterExpired: expected status 'expired', got '${ctx.status}'`);
  }
  return { ...ctx, status: 'pending' };
}
