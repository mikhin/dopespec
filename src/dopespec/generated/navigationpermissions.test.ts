import { describe, it, expect } from 'vitest';
import { evaluateNavigationPermissions } from './navigationpermissions.evaluate.js';

describe('NavigationPermissions', () => {
  it('when isOwner = true, then canViewSchedule = true, canManageSchedule = true, canManageUsers = true, canViewDepartmentList = true, canManageDepartments = true, canManageHotel = true', () => {
    const result = evaluateNavigationPermissions({ hasDepartmentAdmin: false, hasPropertyAdmin: false, isOwner: true });
    expect(result).toEqual({ canViewSchedule: true, canManageSchedule: true, canManageUsers: true, canViewDepartmentList: true, canManageDepartments: true, canManageHotel: true });
  });

  it('when hasPropertyAdmin = true, then canViewSchedule = true, canManageSchedule = true, canManageUsers = true, canViewDepartmentList = true, canManageDepartments = true, canManageHotel = true', () => {
    const result = evaluateNavigationPermissions({ hasDepartmentAdmin: false, hasPropertyAdmin: true, isOwner: false });
    expect(result).toEqual({ canViewSchedule: true, canManageSchedule: true, canManageUsers: true, canViewDepartmentList: true, canManageDepartments: true, canManageHotel: true });
  });

  it('when hasDepartmentAdmin = true, then canViewSchedule = true, canManageSchedule = true, canManageUsers = false, canViewDepartmentList = false, canManageDepartments = true, canManageHotel = false', () => {
    const result = evaluateNavigationPermissions({ hasDepartmentAdmin: true, hasPropertyAdmin: false, isOwner: false });
    expect(result).toEqual({ canViewSchedule: true, canManageSchedule: true, canManageUsers: false, canViewDepartmentList: false, canManageDepartments: true, canManageHotel: false });
  });

  it('default (no conditions), then canViewSchedule = true, canManageSchedule = false, canManageUsers = false, canViewDepartmentList = false, canManageDepartments = false, canManageHotel = false', () => {
    const result = evaluateNavigationPermissions({ hasDepartmentAdmin: false, hasPropertyAdmin: false, isOwner: false });
    expect(result).toEqual({ canViewSchedule: true, canManageSchedule: false, canManageUsers: false, canViewDepartmentList: false, canManageDepartments: false, canManageHotel: false });
  });

});
