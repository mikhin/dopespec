import { describe, it, expect } from 'vitest';
import { evaluateMemberEditPermissions } from './membereditpermissions.evaluate.js';

describe('MemberEditPermissions', () => {
  it('when isSelfEdit = true, isOwner = true, then canEditPersonalData = true, canEditOrgRole = false, canEditPropertyAssignments = false, canManageMembers = true, canManageInvites = false, propertyRoleScope = "none", departmentRoleScope = "none"', () => {
    const result = evaluateMemberEditPermissions({ isOwner: true, isPropertyAdmin: false, isDepartmentAdmin: false, isSelfEdit: true, targetIsOwner: false, targetIsTerminated: false });
    expect(result).toEqual({ canEditPersonalData: true, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: true, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'none' });
  });

  it('when isSelfEdit = true, then canEditPersonalData = false, canEditOrgRole = false, canEditPropertyAssignments = false, canManageMembers = false, canManageInvites = false, propertyRoleScope = "none", departmentRoleScope = "none"', () => {
    const result = evaluateMemberEditPermissions({ isOwner: false, isPropertyAdmin: false, isDepartmentAdmin: false, isSelfEdit: true, targetIsOwner: false, targetIsTerminated: false });
    expect(result).toEqual({ canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: false, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'none' });
  });

  it('when isOwner = true, then canEditPersonalData = true, canEditOrgRole = true, canEditPropertyAssignments = true, canManageMembers = true, canManageInvites = true, propertyRoleScope = "full", departmentRoleScope = "full"', () => {
    const result = evaluateMemberEditPermissions({ isOwner: true, isPropertyAdmin: false, isDepartmentAdmin: false, isSelfEdit: false, targetIsOwner: false, targetIsTerminated: false });
    expect(result).toEqual({ canEditPersonalData: true, canEditOrgRole: true, canEditPropertyAssignments: true, canManageMembers: true, canManageInvites: true, propertyRoleScope: 'full', departmentRoleScope: 'full' });
  });

  it('when targetIsOwner = true, then canEditPersonalData = false, canEditOrgRole = false, canEditPropertyAssignments = false, canManageMembers = false, canManageInvites = false, propertyRoleScope = "none", departmentRoleScope = "none"', () => {
    const result = evaluateMemberEditPermissions({ isOwner: false, isPropertyAdmin: false, isDepartmentAdmin: false, isSelfEdit: false, targetIsOwner: true, targetIsTerminated: false });
    expect(result).toEqual({ canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: false, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'none' });
  });

  it('when targetIsTerminated = true, then canEditPersonalData = false, canEditOrgRole = false, canEditPropertyAssignments = false, canManageMembers = false, canManageInvites = false, propertyRoleScope = "none", departmentRoleScope = "none"', () => {
    const result = evaluateMemberEditPermissions({ isOwner: false, isPropertyAdmin: false, isDepartmentAdmin: false, isSelfEdit: false, targetIsOwner: false, targetIsTerminated: true });
    expect(result).toEqual({ canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: false, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'none' });
  });

  it('when isPropertyAdmin = true, then canEditPersonalData = false, canEditOrgRole = false, canEditPropertyAssignments = true, canManageMembers = true, canManageInvites = false, propertyRoleScope = "limited", departmentRoleScope = "full"', () => {
    const result = evaluateMemberEditPermissions({ isOwner: false, isPropertyAdmin: true, isDepartmentAdmin: false, isSelfEdit: false, targetIsOwner: false, targetIsTerminated: false });
    expect(result).toEqual({ canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: true, canManageMembers: true, canManageInvites: false, propertyRoleScope: 'limited', departmentRoleScope: 'full' });
  });

  it('when isDepartmentAdmin = true, then canEditPersonalData = false, canEditOrgRole = false, canEditPropertyAssignments = false, canManageMembers = true, canManageInvites = false, propertyRoleScope = "none", departmentRoleScope = "limited"', () => {
    const result = evaluateMemberEditPermissions({ isOwner: false, isPropertyAdmin: false, isDepartmentAdmin: true, isSelfEdit: false, targetIsOwner: false, targetIsTerminated: false });
    expect(result).toEqual({ canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: true, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'limited' });
  });

  it('default (no conditions), then canEditPersonalData = false, canEditOrgRole = false, canEditPropertyAssignments = false, canManageMembers = false, canManageInvites = false, propertyRoleScope = "none", departmentRoleScope = "none"', () => {
    const result = evaluateMemberEditPermissions({ isOwner: false, isPropertyAdmin: false, isDepartmentAdmin: false, isSelfEdit: false, targetIsOwner: false, targetIsTerminated: false });
    expect(result).toEqual({ canEditPersonalData: false, canEditOrgRole: false, canEditPropertyAssignments: false, canManageMembers: false, canManageInvites: false, propertyRoleScope: 'none', departmentRoleScope: 'none' });
  });

});
