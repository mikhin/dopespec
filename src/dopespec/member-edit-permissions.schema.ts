/**
 * Member edit permissions — decision table
 *
 * Determines what a user can edit on another member's profile based on:
 * - Current user's org role and admin assignments
 * - Whether editing self
 * - Target member's org role
 *
 * From member-permissions.md:
 *   | Role              | Can Edit                    | Can Manage Invites | Scope             |
 *   | Owner             | All members                 | Yes                | Organization-wide |
 *   | Property Admin    | Property members and below  | No                 | Property-scoped   |
 *   | Department Admin  | Department members          | No                 | Department-scoped |
 *   | Member            | Nobody                      | No                 | None              |
 *
 * Boolean flags are fully captured in the decision table.
 * Dynamic arrays (allowedPropertyIds, allowedDepartmentIds) are computed
 * in the adapter from currentUserMembership.propertyAssignments.
 *
 * Scope enums tell the adapter which role arrays and ID arrays to produce:
 *   - "none"    → empty arrays
 *   - "limited" → ["member", "terminated"]
 *   - "full"    → ["admin", "member", "terminated"]
 */
import { boolean, decisions, oneOf } from "../schema/index.js";

const scopeLevel = oneOf(["none", "limited", "full"] as const);

/**
 * Note: The "no membership" case (null input) is handled by the adapter
 * before calling this decision table. All rules below assume a valid
 * membership exists.
 */
const MemberEditPermissions = decisions("MemberEditPermissions", {
  inputs: {
    isOwner: boolean(),
    isPropertyAdmin: boolean(),
    isDepartmentAdmin: boolean(),
    isSelfEdit: boolean(),
    targetIsOwner: boolean(),
    targetIsTerminated: boolean(),
  },
  outputs: {
    canEditPersonalData: boolean(),
    canEditOrgRole: boolean(),
    canEditPropertyAssignments: boolean(),
    canManageMembers: boolean(),
    canManageInvites: boolean(),
    propertyRoleScope: scopeLevel,
    departmentRoleScope: scopeLevel,
  },
  rules: [
    // Self-edit as owner → personal data only
    {
      when: { isSelfEdit: true, isOwner: true },
      then: {
        canEditPersonalData: true,
        canEditOrgRole: false,
        canEditPropertyAssignments: false,
        canManageMembers: true,
        canManageInvites: false,
        propertyRoleScope: "none",
        departmentRoleScope: "none",
      },
    },

    // Self-edit as non-owner → no permissions
    {
      when: { isSelfEdit: true },
      then: {
        canEditPersonalData: false,
        canEditOrgRole: false,
        canEditPropertyAssignments: false,
        canManageMembers: false,
        canManageInvites: false,
        propertyRoleScope: "none",
        departmentRoleScope: "none",
      },
    },

    // Owner → full permissions (before non-owner checks to avoid blocking owner)
    {
      when: { isOwner: true },
      then: {
        canEditPersonalData: true,
        canEditOrgRole: true,
        canEditPropertyAssignments: true,
        canManageMembers: true,
        canManageInvites: true,
        propertyRoleScope: "full",
        departmentRoleScope: "full",
      },
    },

    // Non-owner editing owner → blocked
    {
      when: { targetIsOwner: true },
      then: {
        canEditPersonalData: false,
        canEditOrgRole: false,
        canEditPropertyAssignments: false,
        canManageMembers: false,
        canManageInvites: false,
        propertyRoleScope: "none",
        departmentRoleScope: "none",
      },
    },

    // Non-owner editing terminated → blocked
    {
      when: { targetIsTerminated: true },
      then: {
        canEditPersonalData: false,
        canEditOrgRole: false,
        canEditPropertyAssignments: false,
        canManageMembers: false,
        canManageInvites: false,
        propertyRoleScope: "none",
        departmentRoleScope: "none",
      },
    },

    // Property admin → scoped to own properties
    {
      when: { isPropertyAdmin: true },
      then: {
        canEditPersonalData: false,
        canEditOrgRole: false,
        canEditPropertyAssignments: true,
        canManageMembers: true,
        canManageInvites: false,
        propertyRoleScope: "limited",
        departmentRoleScope: "full",
      },
    },

    // Department admin → scoped to own departments
    {
      when: { isDepartmentAdmin: true },
      then: {
        canEditPersonalData: false,
        canEditOrgRole: false,
        canEditPropertyAssignments: false,
        canManageMembers: true,
        canManageInvites: false,
        propertyRoleScope: "none",
        departmentRoleScope: "limited",
      },
    },

    // Fallback: regular member → no permissions
    {
      when: {},
      then: {
        canEditPersonalData: false,
        canEditOrgRole: false,
        canEditPropertyAssignments: false,
        canManageMembers: false,
        canManageInvites: false,
        propertyRoleScope: "none",
        departmentRoleScope: "none",
      },
    },
  ],
});

export { MemberEditPermissions };
