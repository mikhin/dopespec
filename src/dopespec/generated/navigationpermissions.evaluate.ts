export type NavigationPermissionsInput = {
  hasDepartmentAdmin: boolean;
  hasPropertyAdmin: boolean;
  isOwner: boolean;
};

export type NavigationPermissionsOutput = {
  canManageDepartments: boolean;
  canManageHotel: boolean;
  canManageSchedule: boolean;
  canManageUsers: boolean;
  canViewDepartmentList: boolean;
  canViewSchedule: boolean;
};

/** Evaluate rules top-to-bottom, return first match. */
export function evaluateNavigationPermissions(input: NavigationPermissionsInput): NavigationPermissionsOutput {
  if (input.isOwner === true) return { canViewSchedule: true, canManageSchedule: true, canManageUsers: true, canViewDepartmentList: true, canManageDepartments: true, canManageHotel: true };
  if (input.hasPropertyAdmin === true) return { canViewSchedule: true, canManageSchedule: true, canManageUsers: true, canViewDepartmentList: true, canManageDepartments: true, canManageHotel: true };
  if (input.hasDepartmentAdmin === true) return { canViewSchedule: true, canManageSchedule: true, canManageUsers: false, canViewDepartmentList: false, canManageDepartments: true, canManageHotel: false };
  return { canViewSchedule: true, canManageSchedule: false, canManageUsers: false, canViewDepartmentList: false, canManageDepartments: false, canManageHotel: false };
  throw new Error('No matching rule for NavigationPermissions');
}
