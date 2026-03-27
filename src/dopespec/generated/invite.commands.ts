export type InviteResendCommand = {
  type: 'InviteResend';
  payload: { organizationId: string; inviteId: string };
};

export type InviteRevokeCommand = {
  type: 'InviteRevoke';
  payload: { organizationId: string; inviteId: string };
};

export type InviteAcceptCommand = {
  type: 'InviteAccept';
  payload: { token: string };
};

export type InviteCommand = InviteResendCommand | InviteRevokeCommand | InviteAcceptCommand;
