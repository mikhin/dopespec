stateDiagram-v2
  [*] --> pending
  pending --> accepted: accept
  pending --> revoked: revoke
  pending --> pending: resend
  revoked --> pending: resendAfterRevoke
  pending --> expired: expire
  expired --> pending: resendAfterExpired
