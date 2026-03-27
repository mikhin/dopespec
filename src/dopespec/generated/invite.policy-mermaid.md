graph LR
  OnlyOwnerCanResend -->|prevent| Invite.resend
  OnlyOwnerCanRevoke -->|prevent| Invite.revoke
  Member -->|belongsTo| Invite
