import {
  action,
  belongsTo,
  date,
  lifecycle,
  model,
  ref,
  string,
} from "../schema/index.js";

// --- Invite ---

const inviteStates = lifecycle.states(
  "pending",
  "accepted",
  "revoked",
  "expired",
);

const Invite = model("Invite", {
  props: {
    id: string(),
    email: string(),
    status: lifecycle(inviteStates),
    createdAt: date(),
    expiresAt: date(),
  },

  relations: {
    organization: belongsTo(ref("Organization")),
    member: belongsTo(ref("Member")),
  },

  actions: {
    resend: action<{ organizationId: string; inviteId: string }>({
      organizationId: string(),
      inviteId: string(),
    }),
    revoke: action<{ organizationId: string; inviteId: string }>({
      organizationId: string(),
      inviteId: string(),
    }),
    accept: action<{ token: string }>({
      token: string(),
    }),
  },

  transitions: ({ from }) => ({
    accept: from(inviteStates.pending)
      .to(inviteStates.accepted)
      .scenario({ email: "bob@alpha.com" }, inviteStates.accepted),

    revoke: from(inviteStates.pending)
      .to(inviteStates.revoked)
      .scenario({ email: "bob@alpha.com" }, inviteStates.revoked),

    resend: from(inviteStates.pending)
      .to(inviteStates.pending)
      .scenario({ email: "bob@alpha.com" }, inviteStates.pending),

    resendAfterRevoke: from(inviteStates.revoked)
      .to(inviteStates.pending)
      .scenario({ email: "bob@alpha.com" }, inviteStates.pending),

    expire: from(inviteStates.pending)
      .to(inviteStates.expired)
      .scenario({ email: "bob@alpha.com" }, inviteStates.expired),

    resendAfterExpired: from(inviteStates.expired)
      .to(inviteStates.pending)
      .scenario({ email: "bob@alpha.com" }, inviteStates.pending),
  }),

  constraints: ({ rule }) => ({
    cannotResendAccepted: rule()
      .when((ctx) => ctx.status === inviteStates.accepted)
      .prevent("resend"),

    cannotRevokeAccepted: rule()
      .when((ctx) => ctx.status === inviteStates.accepted)
      .prevent("revoke"),

    cannotAcceptRevoked: rule()
      .when((ctx) => ctx.status === inviteStates.revoked)
      .prevent("accept"),

    cannotAcceptExpired: rule()
      .when((ctx) => ctx.status === inviteStates.expired)
      .prevent("accept"),
  }),
});

export { Invite };
