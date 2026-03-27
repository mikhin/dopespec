import type { InviteProps } from './invite.types.js';

export type InviteAcceptEvent = {
  type: 'InviteAccept';
  payload: InviteProps;
  from: 'pending';
  to: 'accepted';
  timestamp: Date;
};

export type InviteRevokeEvent = {
  type: 'InviteRevoke';
  payload: InviteProps;
  from: 'pending';
  to: 'revoked';
  timestamp: Date;
};

export type InviteResendEvent = {
  type: 'InviteResend';
  payload: InviteProps;
  from: 'pending';
  to: 'pending';
  timestamp: Date;
};

export type InviteResendAfterRevokeEvent = {
  type: 'InviteResendAfterRevoke';
  payload: InviteProps;
  from: 'revoked';
  to: 'pending';
  timestamp: Date;
};

export type InviteExpireEvent = {
  type: 'InviteExpire';
  payload: InviteProps;
  from: 'pending';
  to: 'expired';
  timestamp: Date;
};

export type InviteResendAfterExpiredEvent = {
  type: 'InviteResendAfterExpired';
  payload: InviteProps;
  from: 'expired';
  to: 'pending';
  timestamp: Date;
};

export type InviteEvent = InviteAcceptEvent | InviteRevokeEvent | InviteResendEvent | InviteResendAfterRevokeEvent | InviteExpireEvent | InviteResendAfterExpiredEvent;
