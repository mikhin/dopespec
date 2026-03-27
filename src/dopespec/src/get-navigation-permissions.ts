/**
 * Adapter: re-exports the dopespec-generated evaluateNavigationPermissions
 * under the original getNavigationPermissions name.
 *
 * This replaces the hand-written function in services/membership/.
 * All existing imports of getNavigationPermissions keep working —
 * the implementation now comes from the decisions() schema.
 */
export {
  evaluateNavigationPermissions as getNavigationPermissions,
  type NavigationPermissionsInput,
  type NavigationPermissionsOutput,
} from '../generated/navigationpermissions.evaluate.js';
