/**
 * Invite authorization policy — "Only Org Admin can resend/revoke invites"
 *
 * From member-permissions.md:
 *   | Editor         | Can Resend | Can Revoke |
 *   | Org Admin      | Yes        | Yes        |
 *   | Property Admin | No         | No         |
 *   | Dept Admin     | No         | No         |
 *
 * Enforced as two policies (one per action) so violation IDs are specific.
 */
import { belongsTo, policy, ref } from "../schema/index.js";

import { Invite } from "./invite.schema.js";

const OnlyOwnerCanResend = policy("OnlyOwnerCanResend", {
  on: { model: Invite, action: "resend" },
  requires: {
    editor: belongsTo(ref("Member")),
  },
  rules: [
    {
      effect: "prevent",
      when: (ctx) => ctx.editor.orgRole !== "owner",
    },
  ],
});

const OnlyOwnerCanRevoke = policy("OnlyOwnerCanRevoke", {
  on: { model: Invite, action: "revoke" },
  requires: {
    editor: belongsTo(ref("Member")),
  },
  rules: [
    {
      effect: "prevent",
      when: (ctx) => ctx.editor.orgRole !== "owner",
    },
  ],
});

export { OnlyOwnerCanResend, OnlyOwnerCanRevoke };
