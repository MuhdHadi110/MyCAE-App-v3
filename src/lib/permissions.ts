import { UserRole, ROLE_HIERARCHY } from '../types/auth.types';

export interface RolePermissions {
  // Project & Research
  canAddProject: boolean;
  canAddResearch: boolean;
  canAddBusinessContact: boolean;

  // Timesheet
  canAddTimesheet: boolean;
  canExportTimesheet: boolean;

  // Team
  canAddTeamMember: boolean;
  canEditTeamMember: boolean;
  canDeleteTeamMember: boolean;

  // Inventory & Equipment
  canAddOrRemoveInventory: boolean;
  canAddMaintenanceDates: boolean;
  canAddOrRemovePC: boolean;
  canCheckoutEquipment: boolean;
  canAssignPC: boolean;

  // Finance
  canAccessFinance: boolean;
  canUploadPO: boolean;
  canApproveInvoices: boolean;
  canViewManHourCost: boolean;
  canViewAnalytics: boolean;
}

/**
 * Get permissions for a single role (helper function)
 */
const getPermissionsForRole = (role: UserRole): RolePermissions => {
  const level = ROLE_HIERARCHY[role] || 0;

  // Admin has full access to everything
  if (role === 'admin') {
    return {
      // Project & Research
      canAddProject: true,
      canAddResearch: true,
      canAddBusinessContact: true,

      // Timesheet
      canAddTimesheet: true,
      canExportTimesheet: true,

      // Team
      canAddTeamMember: true,
      canEditTeamMember: true,
      canDeleteTeamMember: true,

      // Inventory & Equipment
      canAddOrRemoveInventory: true,
      canAddMaintenanceDates: true,
      canAddOrRemovePC: true,
      canCheckoutEquipment: true,
      canAssignPC: true,

      // Finance
      canAccessFinance: true,
      canUploadPO: true,
      canApproveInvoices: true,
      canViewManHourCost: true,
      canViewAnalytics: true,
    };
  }

  return {
    // Project & Research
    canAddProject: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+
    canAddResearch: level >= ROLE_HIERARCHY.engineer, // Level 1+
    canAddBusinessContact: level >= ROLE_HIERARCHY.engineer, // Level 1+

    // Timesheet
    canAddTimesheet: level >= ROLE_HIERARCHY.engineer, // Level 1+
    canExportTimesheet: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+

    // Team - Senior Engineer, Principal Engineer, Manager (all Level 2) can manage teams
    canAddTeamMember: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+ (Senior Engineer, Principal Engineer, Manager)
    canEditTeamMember: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+ (Senior Engineer, Principal Engineer, Manager)
    canDeleteTeamMember: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+ (Senior Engineer, Principal Engineer, Manager)

    // Inventory & Equipment
    canAddOrRemoveInventory: level >= ROLE_HIERARCHY.engineer, // Level 1+
    canAddMaintenanceDates: level >= ROLE_HIERARCHY.engineer, // Level 1+
    canAddOrRemovePC: level >= ROLE_HIERARCHY.engineer, // Level 1+
    canCheckoutEquipment: level >= ROLE_HIERARCHY.engineer, // Level 1+
    canAssignPC: level >= ROLE_HIERARCHY.engineer, // Level 1+

    // Finance
    canAccessFinance: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+
    canUploadPO: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+
    canApproveInvoices: level >= ROLE_HIERARCHY['managing-director'], // Level 3+ (Only Managing Director and Admin)
    canViewManHourCost: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+
    canViewAnalytics: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+
  };
};

/**
 * Get permissions for a single or multiple roles
 * If multiple roles are provided, combines all permissions (OR logic)
 */
export const getPermissions = (roles: UserRole | UserRole[]): RolePermissions => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  if (roleArray.length === 0) {
    return getPermissionsForRole('engineer');
  }

  // If user has admin role, grant all permissions
  if (roleArray.includes('admin')) {
    return getPermissionsForRole('admin');
  }

  // Get permissions for each role and combine them with OR logic
  const allPermissions = roleArray.map(role => getPermissionsForRole(role));

  const combined: RolePermissions = {
    canAddProject: allPermissions.some(p => p.canAddProject),
    canAddResearch: allPermissions.some(p => p.canAddResearch),
    canAddBusinessContact: allPermissions.some(p => p.canAddBusinessContact),
    canAddTimesheet: allPermissions.some(p => p.canAddTimesheet),
    canExportTimesheet: allPermissions.some(p => p.canExportTimesheet),
    canAddTeamMember: allPermissions.some(p => p.canAddTeamMember),
    canEditTeamMember: allPermissions.some(p => p.canEditTeamMember),
    canDeleteTeamMember: allPermissions.some(p => p.canDeleteTeamMember),
    canAddOrRemoveInventory: allPermissions.some(p => p.canAddOrRemoveInventory),
    canAddMaintenanceDates: allPermissions.some(p => p.canAddMaintenanceDates),
    canAddOrRemovePC: allPermissions.some(p => p.canAddOrRemovePC),
    canCheckoutEquipment: allPermissions.some(p => p.canCheckoutEquipment),
    canAssignPC: allPermissions.some(p => p.canAssignPC),
    canAccessFinance: allPermissions.some(p => p.canAccessFinance),
    canUploadPO: allPermissions.some(p => p.canUploadPO),
    canApproveInvoices: allPermissions.some(p => p.canApproveInvoices),
    canViewManHourCost: allPermissions.some(p => p.canViewManHourCost),
    canViewAnalytics: allPermissions.some(p => p.canViewAnalytics),
  };

  return combined;
};

export const getRoleInfo = (role: UserRole) => {
  const roleInfo: Record<UserRole, { label: string; color: string; icon: string; level: number }> = {
    'engineer': {
      label: 'Engineer',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: '🔧',
      level: ROLE_HIERARCHY.engineer,
    },
    'senior-engineer': {
      label: 'Senior Engineer',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: '⚙️',
      level: ROLE_HIERARCHY['senior-engineer'],
    },
    'principal-engineer': {
      label: 'Principal Engineer',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: '🎖️',
      level: ROLE_HIERARCHY['principal-engineer'],
    },
    'manager': {
      label: 'Manager',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '📊',
      level: ROLE_HIERARCHY.manager,
    },
    'managing-director': {
      label: 'Managing Director',
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: '👔',
      level: ROLE_HIERARCHY['managing-director'],
    },
    'admin': {
        label: 'Admin',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: '👑',
        level: ROLE_HIERARCHY.admin,
      },
  };

  return roleInfo[role];
};

export const getPermissionMessage = (action: string, requiredRole: UserRole): string => {
  const roleInfo = getRoleInfo(requiredRole);
  return `This action requires ${roleInfo.label} level or higher. Please contact your manager if you need access.`;
};

/**
 * Check if user has permission with single or multiple roles
 * @param userRoles - User's role(s) - can be single role or array of roles
 * @param permission - Permission to check
 * @returns true if user has the permission
 */
export const checkPermission = (
  userRoles: UserRole | UserRole[],
  permission: keyof RolePermissions
): boolean => {
  const permissions = getPermissions(userRoles);
  return permissions[permission];
};