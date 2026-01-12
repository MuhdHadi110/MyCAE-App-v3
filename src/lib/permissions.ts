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
  canEditInvoices: boolean;
  canViewManHourCost: boolean;
  canViewAnalytics: boolean;
  canManageProjectRates: boolean;
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
      canEditInvoices: true,
      canViewManHourCost: true,
      canViewAnalytics: true,
      canManageProjectRates: true,
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

    // Team - Principal Engineer, Manager, and Managing Director can manage teams
    canAddTeamMember: level >= ROLE_HIERARCHY['principal-engineer'], // Level 2.5+ (Principal Engineer, Manager, Managing Director)
    canEditTeamMember: level >= ROLE_HIERARCHY['principal-engineer'], // Level 2.5+ (Principal Engineer, Manager, Managing Director)
    canDeleteTeamMember: level >= ROLE_HIERARCHY['principal-engineer'], // Level 2.5+ (Principal Engineer, Manager, Managing Director)

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
    canEditInvoices: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+ (Senior Engineer and above)
    canViewManHourCost: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+
    canViewAnalytics: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+
    canManageProjectRates: level >= ROLE_HIERARCHY['senior-engineer'], // Level 2+ (Senior Engineer, Principal Engineer, Manager, Managing Director, Admin)
  };
};

/**
 * Get the highest role from a list of roles
 */
const getHighestRole = (roles: UserRole[]): UserRole => {
  if (roles.length === 0) return 'engineer';

  // If user has admin role, that's always the highest
  if (roles.includes('admin')) return 'admin';

  // Find the role with the highest level
  let highestRole = roles[0];
  let highestLevel = ROLE_HIERARCHY[highestRole] || 0;

  for (const role of roles) {
    const level = ROLE_HIERARCHY[role] || 0;
    if (level > highestLevel) {
      highestLevel = level;
      highestRole = role;
    }
  }

  return highestRole;
};

/**
 * Get permissions for a single or multiple roles
 * If multiple roles are provided, uses the highest role's permissions
 */
export const getPermissions = (roles: UserRole | UserRole[]): RolePermissions => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  if (roleArray.length === 0) {
    return getPermissionsForRole('engineer');
  }

  // Use the highest role's permissions
  const highestRole = getHighestRole(roleArray);
  return getPermissionsForRole(highestRole);
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

export const getPermissionMessage = (_action: string, requiredRole: UserRole): string => {
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