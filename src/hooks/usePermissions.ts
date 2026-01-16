import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPermissions, getRoleInfo, type RolePermissions } from '../lib/permissions';
import type { UserRole } from '../types/auth.types';

/**
 * Hook to get all user permissions in a memoized way
 * Avoids repeated permission checks and provides a clean API
 */
export function usePermissions() {
  const { user } = useAuth();

  const permissions = useMemo((): RolePermissions & {
    isAuthenticated: boolean;
    roleInfo: ReturnType<typeof getRoleInfo> | null;
    roles: UserRole[];
    highestRole: UserRole;
  } => {
    if (!user) {
      return {
        // Project & Research
        canAddProject: false,
        canAddResearch: false,
        canAddBusinessContact: false,
        // Timesheet
        canAddTimesheet: false,
        canExportTimesheet: false,
        // Team
        canAddTeamMember: false,
        canEditTeamMember: false,
        canDeleteTeamMember: false,
        // Inventory & Equipment
        canAddOrRemoveInventory: false,
        canAddMaintenanceDates: false,
        canAddOrRemovePC: false,
        canCheckoutEquipment: false,
        canAssignPC: false,
        // Finance
        canAccessFinance: false,
        canUploadPO: false,
        canApproveInvoices: false,
        canEditInvoices: false,
        canViewManHourCost: false,
        canViewAnalytics: false,
        canManageProjectRates: false,
        // Meta
        isAuthenticated: false,
        roleInfo: null,
        roles: [],
        highestRole: 'engineer' as UserRole,
      };
    }

    const roles = user.roles || [user.role];
    const highestRole = roles.includes('admin' as UserRole)
      ? 'admin' as UserRole
      : roles.reduce((highest, role) => {
          const roleHierarchy: Record<string, number> = {
            'engineer': 1,
            'senior-engineer': 2,
            'principal-engineer': 3,
            'manager': 3,
            'managing-director': 4,
            'admin': 5,
          };
          return (roleHierarchy[role] || 0) > (roleHierarchy[highest] || 0) ? role : highest;
        }, roles[0]);

    const basePermissions = getPermissions(roles);

    return {
      ...basePermissions,
      isAuthenticated: true,
      roleInfo: getRoleInfo(highestRole),
      roles,
      highestRole,
    };
  }, [user]);

  return permissions;
}

export default usePermissions;
