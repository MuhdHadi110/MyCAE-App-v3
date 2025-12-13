/**
 * Team/Staff Management Types
 */

export type UserRole = 'engineer' | 'senior-engineer' | 'principal-engineer' | 'manager' | 'managing-director' | 'admin';
export type Department = 'engineering' | 'project-management';

export interface TeamMember {
  id: string;
  userId?: string; // User ID from users table (for foreign key relationships)
  name: string;
  email: string;
  role: UserRole;
  department: Department;
  phone?: string;
  avatar?: string;
  activeProjects: number;
  totalHoursThisMonth: number;
  joinDate: string;
  status: 'active' | 'inactive';
  hourlyRate?: number; // Hourly rate for financial calculations
  position?: string;
  certifications?: string[];
}
