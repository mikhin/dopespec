/**
 * Adapter: wraps the dopespec-generated evaluateInviteUiVisibility
 * for use in member-form-invite-details.tsx.
 *
 * Replaces scattered status checks:
 *   - if status === "accepted" → hide entire section
 *   - if status === "pending"  → show Resend + Revoke
 *   - if status === "revoked"  → show Resend only
 *   - canManageInvites must be true
 *
 * Original: member-form-invite-details.tsx inline conditionals
 */
import {
  evaluateInviteUiVisibility,
  type InviteUiVisibilityInput,
  type InviteUiVisibilityOutput,
} from "../generated/inviteuivisibility.evaluate.js";

type InviteStatus = InviteUiVisibilityInput["inviteStatus"];

type Invite = {
  id: string;
  email: string;
  status: string;
  createdAt: string;
};

/**
 * Determine invite UI visibility from an invite object and permission flag.
 *
 * Returns null when the section should be hidden entirely (no invite,
 * unrecognized status, or decision table says isVisible = false).
 */
export function getInviteUiVisibility(
  invite: Invite | null | undefined,
  canManageInvites: boolean,
): InviteUiVisibilityOutput | null {
  if (!invite) return null;

  const validStatuses: InviteStatus[] = [
    "pending",
    "accepted",
    "revoked",
    "expired",
  ];

  if (!validStatuses.includes(invite.status as InviteStatus)) return null;

  const result = evaluateInviteUiVisibility({
    inviteStatus: invite.status as InviteStatus,
    canManageInvites,
  });

  if (!result.isVisible) return null;

  return result;
}

export type { InviteUiVisibilityOutput };
