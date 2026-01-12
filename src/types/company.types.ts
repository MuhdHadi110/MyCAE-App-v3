export type CompanyType = 'vendor' | 'client' | 'customer' | 'supplier';

export interface Company {
  id: string;
  name: string;
  company_type?: CompanyType[];
  industry?: string;
  website?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Contact {
  id: string;
  company_id: string;
  name: string;
  email: string;
  phone?: string;
  position?: string;
  company?: Company; // populated in API responses
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface CompanyWithContacts extends Company {
  contacts: Contact[];
}
