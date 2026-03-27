export type MemberEditPermissionsInput = {
  isOwner: boolean;
  isPropertyAdmin: boolean;
  isDepartmentAdmin: boolean;
  isSelfEdit: boolean;
  targetIsOwner: boolean;
  targetIsTerminated: boolean;
};

export type MemberEditPermissionsOutput = {
  canEditPersonalData: boolean;
  canEditOrgRole: boolean;
  canEditPropertyAssignments: boolean;
  canManageMembers: boolean;
  canManageInvites: boolean;
  propertyRoleScope: 'none' | 'limited' | 'full';
  departmentRoleScope: 'none' | 'limited' | 'full';
};

/** Evaluate rules top-to-bottom, return first match. */
export function evaluateMemberEditPermissions(input: MemberEditPermissionsInput): MemberEditPermissionsOutput {
  if (input.isSelfEdit === true && input.isOwner === true) return { canEditPersonalData: true, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: true, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'none' };
  if (input.isSelfEdit === true) return { canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: false, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'none' };
  if (input.isOwner === true) return { canEditPersonalData: true, canEditOrgRole: true, canEditPropertyAssignments: true, canManageMembers: true, canManageInvites: true, propertyRoleScope: 'full', departmentRoleScope: 'full' };
  if (input.targetIsOwner === true) return { canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: false, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'none' };
  if (input.targetIsTerminated === true) return { canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: false, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'none' };
  if (input.isPropertyAdmin === true) return { canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: true, canManageMembers: true, canManageInvites: false, propertyRoleScope: 'limited', departmentRoleScope: 'full' };
  if (input.isDepartmentAdmin === true) return { canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: true, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'limited' };
  return { canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: false, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'none' };
}
