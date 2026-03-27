/**
 * Invite UI visibility — decision table
 *
 * Replaces scattered status checks in member-form-invite-details.tsx:
 *   - status === "accepted" → hide entire section
 *   - status === "pending"  → show Resend + Revoke buttons
 *   - status === "revoked"  → show Resend only
 *   - canManageInvites must be true (owner only)
 *
 * Uses oneOf() for inviteStatus (decisions() does not accept lifecycle()).
 * Values kept in sync with invite.schema.ts lifecycle states.
 */
import { boolean, decisions, oneOf } from "../schema/index.js";

const inviteStatus = oneOf(["pending", "accepted", "revoked", "expired"] as const);

const InviteUiVisibility = decisions("InviteUiVisibility", {
  inputs: {
    inviteStatus,
    canManageInvites: boolean(),
  },
  outputs: {
    isVisible: boolean(),
    showResend: boolean(),
    showRevoke: boolean(),
  },
  rules: [
    // Pending + can manage → show Resend + Revoke
    {
      when: { inviteStatus: "pending", canManageInvites: true },
      then: { isVisible: true, showResend: true, showRevoke: true },
    },

    // Revoked + can manage → show Resend only
    {
      when: { inviteStatus: "revoked", canManageInvites: true },
      then: { isVisible: true, showResend: true, showRevoke: false },
    },

    // Everything else → hidden (accepted, expired, no permission)
    {
      when: {},
      then: { isVisible: false, showResend: false, showRevoke: false },
    },
  ],
});

export { InviteUiVisibility };
