import { create } from 'zustand';
import { Company, Contact, CompanyWithContacts } from '../types/company.types';
import { httpClient } from '../services/http-client';
import toast from 'react-hot-toast';

interface CompanyStore {
  companies: CompanyWithContacts[];
  loading: boolean;
  error: string | null;

  // Company operations
  fetchCompanies: () => Promise<void>;
  createCompany: (data: Partial<Company>) => Promise<Company | null>;
  updateCompany: (id: string, data: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;

  // Contact operations
  createContact: (data: Partial<Contact>) => Promise<Contact | null>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
}

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  companies: [],
  loading: false,
  error: null,

  fetchCompanies: async () => {
    set({ loading: true, error: null });
    try {
      const response = await httpClient.api.get<CompanyWithContacts[]>('/companies');
      set({ companies: response.data, loading: false });
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      set({
        error: error.response?.data?.error || 'Failed to fetch companies',
        loading: false,
      });
      toast.error('Failed to fetch companies');
    }
  },

  createCompany: async (data: Partial<Company>) => {
    set({ loading: true, error: null });
    try {
      const response = await httpClient.api.post<{ company: Company }>('/companies', data);

      // Add new company to the list
      set((state) => ({
        companies: [...state.companies, { ...response.data.company, contacts: [] }],
        loading: false,
      }));

      toast.success('Company created successfully');
      return response.data.company;
    } catch (error: any) {
      console.error('Error creating company:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create company';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  updateCompany: async (id: string, data: Partial<Company>) => {
    set({ loading: true, error: null });
    try {
      const response = await httpClient.api.put<{ company: Company }>(`/companies/${id}`, data);

      // Update company in the list
      set((state) => ({
        companies: state.companies.map((company) =>
          company.id === id ? { ...company, ...response.data.company } : company
        ),
        loading: false,
      }));

      toast.success('Company updated successfully');
    } catch (error: any) {
      console.error('Error updating company:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update company';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  deleteCompany: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await httpClient.api.delete(`/companies/${id}`);

      // Remove company from the list
      set((state) => ({
        companies: state.companies.filter((company) => company.id !== id),
        loading: false,
      }));

      toast.success('Company deleted successfully');
    } catch (error: any) {
      console.error('Error deleting company:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete company';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  createContact: async (data: Partial<Contact>) => {
    set({ loading: true, error: null });
    try {
      const response = await httpClient.api.post<{ contact: Contact }>('/contacts', data);
      const newContact = response.data.contact;

      // Add new contact to the appropriate company
      set((state) => ({
        companies: state.companies.map((company) =>
          company.id === newContact.company_id
            ? { ...company, contacts: [...company.contacts, newContact] }
            : company
        ),
        loading: false,
      }));

      toast.success('Contact created successfully');
      return newContact;
    } catch (error: any) {
      console.error('Error creating contact:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create contact';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
      return null;
    }
  },

  updateContact: async (id: string, data: Partial<Contact>) => {
    set({ loading: true, error: null });
    try {
      const response = await httpClient.api.put<{ contact: Contact }>(`/contacts/${id}`, data);
      const updatedContact = response.data.contact;

      // Update contact in the appropriate company
      set((state) => ({
        companies: state.companies.map((company) =>
          company.id === updatedContact.company_id
            ? {
                ...company,
                contacts: company.contacts.map((contact) =>
                  contact.id === id ? updatedContact : contact
                ),
              }
            : company
        ),
        loading: false,
      }));

      toast.success('Contact updated successfully');
    } catch (error: any) {
      console.error('Error updating contact:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update contact';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  deleteContact: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await httpClient.api.delete(`/contacts/${id}`);

      // Remove contact from the appropriate company
      set((state) => ({
        companies: state.companies.map((company) => ({
          ...company,
          contacts: company.contacts.filter((contact) => contact.id !== id),
        })),
        loading: false,
      }));

      toast.success('Contact deleted successfully');
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      const errorMessage = error.response?.data?.error || 'Failed to delete contact';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },
}));
