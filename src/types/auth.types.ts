export type UserRole = 'engineer' | 'senior-engineer' | 'principal-engineer' | 'manager' | 'managing-director' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole; // Primary role (first role in roles array, for backward compatibility)
  roles: UserRole[]; // All roles assigned to the user
  department: string;
  avatar?: string;
  position?: string;
}

import { RolePermissions } from '../lib/permissions';

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, captchaToken?: string) => Promise<User & { isFirstTimeLogin?: boolean }>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: keyof RolePermissions) => boolean;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  'engineer': 1,
  'senior-engineer': 2,
  'principal-engineer': 3,
  'manager': 3,
  'managing-director': 4,
  'admin': 5,
};
