/**
 * Adapter: wraps the dopespec-generated evaluateMemberEditPermissions
 * with the original getMemberEditPermissions signature.
 *
 * The decision table handles boolean flags and role scope levels.
 * This adapter handles:
 *   1. Null membership guard (before decision table)
 *   2. Extracting admin property/department IDs from membership
 *   3. Mapping scope levels ("none"/"limited"/"full") to role arrays
 *   4. Assembling the final MemberEditPermissions object
 *
 * Original: services/membership/get-member-edit-permissions.ts
 */
import {
  evaluateMemberEditPermissions,
  type MemberEditPermissionsOutput,
} from "../generated/membereditpermissions.evaluate.js";

// --- Types matching the original API ---

type OrgRole = "owner" | "employee" | "terminated";
type PropertyRole = "admin" | "member" | "terminated";
type DepartmentRole = "admin" | "member" | "terminated";

type Membership = {
  id: string;
  orgRole: OrgRole;
  propertyAssignments: Array<{
    property: { id: string; name: string };
    propertyRole: PropertyRole;
    departmentAssignments?: Array<{
      department: { id: string; name: string };
      departmentRole: DepartmentRole;
    }>;
  }>;
};

type MemberEditPermissions = {
  allowedDepartmentIds: string[];
  allowedDepartmentRoles: DepartmentRole[];
  allowedPropertyIds: string[];
  allowedPropertyRoles: PropertyRole[];
  canEditOrgRole: boolean;
  canEditPersonalData: boolean;
  canEditPropertyAssignments: boolean;
  canManageInvites: boolean;
  canManageMembers: boolean;
  reason?: string;
};

// --- Scope-to-roles mapping ---

const PROPERTY_ROLES: Record<
  MemberEditPermissionsOutput["propertyRoleScope"],
  PropertyRole[]
> = {
  full: ["admin", "member", "terminated"],
  limited: ["member", "terminated"],
  none: [],
};

const DEPARTMENT_ROLES: Record<
  MemberEditPermissionsOutput["departmentRoleScope"],
  DepartmentRole[]
> = {
  full: ["admin", "member", "terminated"],
  limited: ["member", "terminated"],
  none: [],
};

// --- Reason mapping ---

function resolveReason(
  output: MemberEditPermissionsOutput,
  isSelfEdit: boolean,
  isOwner: boolean,
  targetIsOwner: boolean,
  targetIsTerminated: boolean,
): string | undefined {
  // Self-edit cases
  if (isSelfEdit && isOwner)
    return "Can only edit personal data (not role assignments)";
  if (isSelfEdit) return "Cannot edit your own membership";

  // If has permissions, no reason needed
  if (output.canManageMembers) return undefined;

  // Blocked cases
  if (targetIsOwner) return "Cannot edit organization owner";
  if (targetIsTerminated) return "Cannot edit terminated organization member";

  return "Insufficient permissions";
}

// --- No-permissions shorthand ---

const noPermissions = (reason: string): MemberEditPermissions => ({
  allowedDepartmentIds: [],
  allowedDepartmentRoles: [],
  allowedPropertyIds: [],
  allowedPropertyRoles: [],
  canEditOrgRole: false,
  canEditPersonalData: false,
  canEditPropertyAssignments: false,
  canManageInvites: false,
  canManageMembers: false,
  reason,
});

// --- Admin ID extraction ---

function getAdminPropertyIds(membership: Membership): string[] {
  return (membership.propertyAssignments || [])
    .filter((pa) => pa.propertyRole === "admin")
    .map((pa) => pa.property.id);
}

function getAdminDepartmentIds(membership: Membership): string[] {
  return (membership.propertyAssignments || [])
    .flatMap(
      (pa) =>
        pa.departmentAssignments?.filter(
          (da) => da.departmentRole === "admin",
        ) || [],
    )
    .map((da) => da.department.id);
}

// --- Main adapter ---

/**
 * Determine member edit permissions based on current user's membership.
 *
 * Same signature as the original hand-written function.
 * Core logic now driven by dopespec decisions() table.
 */
export const getMemberEditPermissions = (
  currentUserMembership: Membership | null,
  targetMemberOrgRole?: OrgRole,
  targetMemberId?: string,
  currentMembershipId?: string,
): MemberEditPermissions => {
  // Guard: no membership → no permissions (handled before decision table)
  if (!currentUserMembership) {
    return noPermissions("No active membership");
  }

  const isOwner = currentUserMembership.orgRole === "owner";
  const adminPropertyIds = getAdminPropertyIds(currentUserMembership);
  const adminDepartmentIds = getAdminDepartmentIds(currentUserMembership);
  const isPropertyAdmin = adminPropertyIds.length > 0;
  const isDepartmentAdmin = adminDepartmentIds.length > 0;
  const isSelfEdit = Boolean(
    targetMemberId &&
      currentMembershipId &&
      targetMemberId === currentMembershipId,
  );
  const targetIsOwner = targetMemberOrgRole === "owner";
  const targetIsTerminated = targetMemberOrgRole === "terminated";

  // Run decision table
  const output = evaluateMemberEditPermissions({
    isDepartmentAdmin,
    isOwner,
    isPropertyAdmin,
    isSelfEdit,
    targetIsOwner,
    targetIsTerminated,
  });

  // Map scope levels to concrete arrays
  const allowedPropertyRoles = PROPERTY_ROLES[output.propertyRoleScope];
  const allowedDepartmentRoles = DEPARTMENT_ROLES[output.departmentRoleScope];

  // Property IDs: "full" scope = empty (means all), "limited" = admin's properties, "none" = empty
  const allowedPropertyIds =
    output.propertyRoleScope === "limited" ? adminPropertyIds : [];

  // Department IDs: "limited" = admin's departments, otherwise empty (all or none)
  const allowedDepartmentIds =
    output.departmentRoleScope === "limited" ? adminDepartmentIds : [];

  const reason = resolveReason(
    output,
    isSelfEdit,
    isOwner,
    targetIsOwner,
    targetIsTerminated,
  );

  return {
    allowedDepartmentIds,
    allowedDepartmentRoles,
    allowedPropertyIds,
    allowedPropertyRoles,
    canEditOrgRole: output.canEditOrgRole,
    canEditPersonalData: output.canEditPersonalData,
    canEditPropertyAssignments: output.canEditPropertyAssignments,
    canManageInvites: output.canManageInvites,
    canManageMembers: output.canManageMembers,
    ...(reason !== undefined ? { reason } : {}),
  };
};
