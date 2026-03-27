import { boolean, decisions } from "../schema/index.js";

const NavigationPermissions = decisions("NavigationPermissions", {
  inputs: {
    hasDepartmentAdmin: boolean(),
    hasPropertyAdmin: boolean(),
    isOwner: boolean(),
  },
  outputs: {
    canManageDepartments: boolean(),
    canManageHotel: boolean(),
    canManageSchedule: boolean(),
    canManageUsers: boolean(),
    canViewDepartmentList: boolean(),
    canViewSchedule: boolean(),
  },
  rules: [
    { when: { isOwner: true }, then: { canViewSchedule: true, canManageSchedule: true, canManageUsers: true, canViewDepartmentList: true, canManageDepartments: true, canManageHotel: true } },
    { when: { hasPropertyAdmin: true }, then: { canViewSchedule: true, canManageSchedule: true, canManageUsers: true, canViewDepartmentList: true, canManageDepartments: true, canManageHotel: true } },
    { when: { hasDepartmentAdmin: true }, then: { canViewSchedule: true, canManageSchedule: true, canManageUsers: false, canViewDepartmentList: false, canManageDepartments: true, canManageHotel: false } },
    { when: {}, then: { canViewSchedule: true, canManageSchedule: false, canManageUsers: false, canViewDepartmentList: false, canManageDepartments: false, canManageHotel: false } },
  ],
});

export { NavigationPermissions };
