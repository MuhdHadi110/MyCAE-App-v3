export type UserRole = 'engineer' | 'senior-engineer' | 'principal-engineer' | 'manager' | 'managing-director' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
  'senior-engineer': 2, // Level 2: Senior Engineer
  'principal-engineer': 2, // Level 2: Same as Senior Engineer and Manager
  'manager': 2, // Level 2: Same as Senior Engineer and Principal Engineer
  'managing-director': 3, // Level 3: Managing Director
  'admin': 4, // Level 4: Admin (highest)
};
