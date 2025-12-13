/**
 * Client/Customer Types
 */

export type ClientCategory = 'client' | 'customer' | 'vendor' | 'supplier';

export interface Client {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address?: string;
  industry?: string;
  website?: string;
  categories: ClientCategory[];
  notes?: string;
  activeProjects: number;
  totalProjects: number;
  createdDate: string;
  lastUpdated: string;
}
