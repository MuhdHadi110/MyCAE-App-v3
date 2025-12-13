import axios, { AxiosInstance } from 'axios';
import type { InventoryItem, BulkCheckout } from '../types/inventory.types';
import type { ExtendedCheckout } from '../types/checkout.types';
import type { MaintenanceTicket } from '../types/maintenance.types';

/**
 * API Service for MySQL Backend
 *
 * This service replaces SharePoint API calls with RESTful API calls
 * to the Node.js/Express backend with MySQL database.
 */

// Helper function to transform snake_case to camelCase
const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

// Transform object keys from snake_case to camelCase
const transformKeysToCAmelCase = (obj: any): any => {
  try {
    if (Array.isArray(obj)) {
      return obj.map(item => transformKeysToCAmelCase(item));
    } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = snakeToCamel(key);
        const value = obj[key];
        result[camelKey] = (value !== null && typeof value === 'object' && !(value instanceof Date))
          ? transformKeysToCAmelCase(value)
          : value;
        return result;
      }, {} as any);
    }
    return obj;
  } catch (error) {
    console.error('Error in transformKeysToCAmelCase:', error);
    return obj;
  }
};

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    // API base URL - hardcoded to use Vite proxy
    const baseURL = '/api';
    console.log('🔧 API Service initialized with baseURL:', baseURL);

    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.setAuthToken(this.token);
    }

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.token = token;
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear authentication
   */
  clearAuth() {
    this.token = null;
    delete this.api.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }

  // ==================== Authentication ====================

  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) {
    const response = await this.api.post('/auth/register', data);
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response.data;
  }

  async login(email: string, password: string, captchaToken?: string) {
    const response = await this.api.post('/auth/login', { email, password, captchaToken });
    if (response.data.token) {
      this.setAuthToken(response.data.token);
    }
    return response.data;
  }

  async logout() {
    this.clearAuth();
  }

  async changePassword(email: string, currentPassword: string, newPassword: string) {
    const response = await this.api.post('/auth/change-password', {
      email,
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // ==================== User Profile ====================

  async uploadAvatar(file: File): Promise<{ success: boolean; avatarUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('avatarFile', file);

    const response = await this.api.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getCurrentUserProfile(): Promise<any> {
    const response = await this.api.get('/users/profile');
    return response.data;
  }

  // ==================== Inventory Items ====================

  async getInventoryItems(filters?: {
    category?: string;
    status?: string;
    lowStock?: boolean;
    search?: string;
  }): Promise<InventoryItem[]> {
    const response = await this.api.get('/inventory', { params: filters });
    return response.data;
  }

  async getInventoryById(id: string): Promise<InventoryItem> {
    const response = await this.api.get(`/inventory/${id}`);
    return response.data;
  }

  async createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    const response = await this.api.post('/inventory', item);
    return response.data;
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const response = await this.api.put(`/inventory/${id}`, updates);
    return response.data;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    await this.api.delete(`/inventory/${id}`);
  }

  async bulkCreateInventoryItems(items: Array<Omit<InventoryItem, 'id'>>): Promise<{
    success: boolean;
    imported: number;
    failed: number;
    errors?: Array<{ row: number; error: string }>;
  }> {
    const response = await this.api.post('/inventory/bulk/create', { items });
    return response.data;
  }

  // ==================== Checkouts ====================

  async createSingleCheckout(checkout: any): Promise<{ success: boolean; checkoutId: string; masterBarcode: string; message: string }> {
    const response = await this.api.post('/checkouts/single', checkout);
    return response.data;
  }

  async createBulkCheckout(checkout: BulkCheckout): Promise<{ success: boolean; masterBarcode: string; checkoutsCreated: number; message: string }> {
    const response = await this.api.post('/checkouts/bulk', checkout);
    return response.data;
  }

  async checkInSingle(checkIn: any): Promise<{ success: boolean; message: string; checkoutStatus: string; remainingQuantity: number }> {
    const response = await this.api.post('/checkouts/checkin/single', checkIn);
    return response.data;
  }

  async checkInBulk(checkIn: any): Promise<{ success: boolean; message: string; returnType: string; masterBarcode: string }> {
    const response = await this.api.post('/checkouts/checkin/bulk', checkIn);
    return response.data;
  }

  async getAllCheckouts(): Promise<ExtendedCheckout[]> {
    const response = await this.api.get('/checkouts');
    return response.data;
  }

  async getCheckoutByMasterBarcode(masterBarcode: string): Promise<any> {
    const response = await this.api.get(`/checkouts/${masterBarcode}`);
    return response.data;
  }

  // ==================== Maintenance Tickets ====================

  async getAllMaintenanceTickets(): Promise<MaintenanceTicket[]> {
    const response = await this.api.get('/maintenance');
    return response.data;
  }

  async createMaintenanceTicket(ticket: Omit<MaintenanceTicket, 'id'>): Promise<MaintenanceTicket> {
    const response = await this.api.post('/maintenance', ticket);
    return response.data;
  }

  async updateMaintenanceTicket(id: string, updates: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> {
    const response = await this.api.put(`/maintenance/${id}`, updates);
    return response.data;
  }

  async deleteMaintenanceTicket(id: string): Promise<void> {
    await this.api.delete(`/maintenance/${id}`);
  }

  async getMaintenanceTicketById(id: string): Promise<MaintenanceTicket> {
    const response = await this.api.get(`/maintenance/${id}`);
    return response.data;
  }

  // ==================== Activity Log ====================

  async createActivityLog(activity: {
    action: string;
    description: string;
    user: string;
    timestamp: string;
  }): Promise<any> {
    const response = await this.api.post('/activity', activity);
    return response.data;
  }

  async getRecentActivity(limit: number = 10): Promise<any[]> {
    const response = await this.api.get('/activity', { params: { limit } });
    return response.data;
  }

  // ==================== Projects ===================

  async getProjects(filters?: any): Promise<any[]> {
    const response = await this.api.get('/projects', { params: filters });
    try {
      const transformed = transformKeysToCAmelCase(response.data);
      // Extract engineer and manager names from the joined user objects
      const projects = Array.isArray(transformed) ? transformed : [transformed];

      const enriched = projects.map((project: any) => ({
        ...project,
        // Add engineerId alias for compatibility with dashboards
        engineerId: project.leadEngineerId || project.engineerId,
        engineerName: project.leadEngineer?.name || project.engineerName,
        managerName: project.manager?.name || project.managerName,
      }));

      return enriched;
    } catch (error) {
      console.error('Error transforming projects data:', error);
      return response.data;
    }
  }

  async getProjectById(id: string): Promise<any> {
    const response = await this.api.get(`/projects/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async createProject(project: any): Promise<any> {
    const response = await this.api.post('/projects', project);
    return transformKeysToCAmelCase(response.data);
  }

  async updateProject(id: string, updates: any): Promise<any> {
    const response = await this.api.put(`/projects/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteProject(id: string): Promise<void> {
    await this.api.delete(`/projects/${id}`);
  }

  async updateProjectStatus(id: string, status: string, dateField?: { field: string; value: string }): Promise<any> {
    const response = await this.api.patch(`/projects/${id}/status`, { status, dateField });
    return transformKeysToCAmelCase(response.data);
  }

  async uploadProjectPO(id: string, file: File): Promise<{ success: boolean; fileUrl: string; message: string }> {
    const formData = new FormData();
    formData.append('poFile', file);

    const response = await this.api.post(`/projects/${id}/upload-po`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async deleteProjectPO(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.api.delete(`/projects/${id}/po-file`);
    return response.data;
  }

  async downloadProjectPO(fileUrl: string): Promise<Blob> {
    const response = await this.api.get(fileUrl, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ==================== Timesheets ====================

  async getTimesheets(filters?: any): Promise<any[]> {
    const response = await this.api.get('/timesheets', { params: filters });
    // Backend returns { data: [...], total, limit, offset }
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return transformKeysToCAmelCase(data);
  }

  async createTimesheet(timesheet: any): Promise<any> {
    const response = await this.api.post('/timesheets', timesheet);
    return transformKeysToCAmelCase(response.data);
  }

  async updateTimesheet(id: string, updates: any): Promise<any> {
    const response = await this.api.put(`/timesheets/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteTimesheet(id: string): Promise<void> {
    await this.api.delete(`/timesheets/${id}`);
  }

  // ==================== Clients ====================

  async getAllClients(filters?: any): Promise<any[]> {
    const response = await this.api.get('/clients', { params: filters });
    // The backend returns { data: [...], total, limit, offset }
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return transformKeysToCAmelCase(data);
  }

  async getClientById(id: string): Promise<any> {
    const response = await this.api.get(`/clients/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async createClient(client: any): Promise<any> {
    const response = await this.api.post('/clients', client);
    return transformKeysToCAmelCase(response.data);
  }

  async updateClient(id: string, updates: any): Promise<any> {
    const response = await this.api.put(`/clients/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteClient(id: string): Promise<void> {
    await this.api.delete(`/clients/${id}`);
  }

  // ==================== Team Members ====================

  async getAllTeamMembers(filters?: any): Promise<any[]> {
    const response = await this.api.get('/team', { params: filters });
    // The backend returns { data: [...], total, limit, offset }
    const data = Array.isArray(response.data) ? response.data : (response.data.data || []);
    return transformKeysToCAmelCase(data);
  }

  async getTeamMemberById(id: string): Promise<any> {
    const response = await this.api.get(`/team/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async createTeamMember(member: any): Promise<any> {
    const response = await this.api.post('/team', member);
    return transformKeysToCAmelCase(response.data);
  }

  async updateTeamMember(id: string, updates: any): Promise<any> {
    const response = await this.api.put(`/team/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteTeamMember(id: string): Promise<void> {
    await this.api.delete(`/team/${id}`);
  }

  async getTeamByDepartment(department: string, filters?: any): Promise<any[]> {
    const response = await this.api.get(`/team/department/${department}`, { params: filters });
    return response.data;
  }

  // ==================== Computers/PC ====================

  async getAllComputers(filters?: any): Promise<any[]> {
    const response = await this.api.get('/computers', { params: filters });
    return response.data;
  }

  async getComputerById(id: string): Promise<any> {
    const response = await this.api.get(`/computers/${id}`);
    return response.data;
  }

  async createComputer(computer: any): Promise<any> {
    const response = await this.api.post('/computers', computer);
    return response.data;
  }

  async updateComputer(id: string, updates: any): Promise<any> {
    const response = await this.api.put(`/computers/${id}`, updates);
    return response.data;
  }

  async deleteComputer(id: string): Promise<void> {
    await this.api.delete(`/computers/${id}`);
  }

  async getComputersAssignedTo(userId: string, filters?: any): Promise<any[]> {
    const response = await this.api.get(`/computers/assigned/${userId}`, { params: filters });
    return response.data;
  }

  async assignComputerToUser(computerId: string, userId: string): Promise<any> {
    const response = await this.api.post(`/computers/${computerId}/assign`, { userId });
    return response.data;
  }

  async unassignComputer(computerId: string): Promise<any> {
    const response = await this.api.post(`/computers/${computerId}/unassign`, {});
    return response.data;
  }

  // ==================== Research Projects ====================

  async getAllResearchProjects(filters?: any): Promise<any[]> {
    const response = await this.api.get('/research/projects', { params: filters });
    return transformKeysToCAmelCase(response.data);
  }

  async getResearchProjectById(id: string): Promise<any> {
    const response = await this.api.get(`/research/projects/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async createResearchProject(project: any): Promise<any> {
    const response = await this.api.post('/research/projects', project);
    return transformKeysToCAmelCase(response.data);
  }

  async updateResearchProject(id: string, updates: any): Promise<any> {
    const response = await this.api.put(`/research/projects/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteResearchProject(id: string): Promise<void> {
    await this.api.delete(`/research/projects/${id}`);
  }

  async getResearchProjectsByStatus(status: string, filters?: any): Promise<any[]> {
    const response = await this.api.get(`/research/projects/status/${status}`, { params: filters });
    return transformKeysToCAmelCase(response.data);
  }

  async logResearchTimesheet(entry: any): Promise<any> {
    const response = await this.api.post('/research/timesheets', entry);
    return transformKeysToCAmelCase(response.data);
  }

  async approveResearchTimesheet(entryId: string, approvedBy: string): Promise<any> {
    const response = await this.api.put(`/research/timesheets/${entryId}/approve`, { approvedBy });
    return transformKeysToCAmelCase(response.data);
  }

  async deleteResearchTimesheet(entryId: string): Promise<void> {
    await this.api.delete(`/research/timesheets/${entryId}`);
  }

  // ==================== Activity Log - Enhanced ====================

  async getAllActivity(filters?: any): Promise<any> {
    const response = await this.api.get('/activity', { params: filters });
    return response.data;
  }

  async getActivityById(id: string): Promise<any> {
    const response = await this.api.get(`/activity/${id}`);
    return response.data;
  }

  async getActivityByUser(userId: string, filters?: any): Promise<any> {
    const response = await this.api.get(`/activity/user/${userId}`, { params: filters });
    return response.data;
  }

  async getActivityByModule(module: string, filters?: any): Promise<any> {
    const response = await this.api.get(`/activity/module/${module}`, { params: filters });
    return response.data;
  }

  // ==================== Environment Info ====================

  isProduction(): boolean {
    return import.meta.env.PROD;
  }

  getEnvironmentInfo(): { isProduction: boolean; url: string } {
    return {
      isProduction: this.isProduction(),
      url: this.api.defaults.baseURL || 'Unknown',
    };
  }

  // ==================== Migration ====================

  async uploadMigrationFile(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.api.post('/migration/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async executeMigration(projects: any[]): Promise<any> {
    const response = await this.api.post('/migration/execute', { projects });
    return response.data;
  }

  async getMigrationTemplate(): Promise<any> {
    const response = await this.api.get('/migration/template');
    return response.data;
  }

  // ==================== Purchase Orders ====================

  async getAllPurchaseOrders(filters?: any): Promise<any> {
    const response = await this.api.get('/purchase-orders', { params: filters });
    return response.data;
  }

  async getPurchaseOrderById(id: string): Promise<any> {
    const response = await this.api.get(`/purchase-orders/${id}`);
    return response.data;
  }

  async createPurchaseOrder(data: {
    poNumber: string;
    projectCode: string;
    clientName: string;
    amount: number | string;
    receivedDate: Date | string;
    dueDate?: Date | string;
    description?: string;
    status?: string;
    fileUrl?: string;
  }): Promise<any> {
    const response = await this.api.post('/purchase-orders', data);
    return response.data;
  }

  async updatePurchaseOrder(id: string, updates: any): Promise<any> {
    const response = await this.api.put(`/purchase-orders/${id}`, updates);
    return response.data;
  }

  async deletePurchaseOrder(id: string): Promise<any> {
    const response = await this.api.delete(`/purchase-orders/${id}`);
    return response.data;
  }

  async uploadPurchaseOrderFile(formData: FormData): Promise<any> {
    const response = await this.api.post('/purchase-orders/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async downloadPurchaseOrderFile(filename: string): Promise<Blob> {
    const response = await this.api.get(`/purchase-orders/download/${filename}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ==================== Invoices ====================

  async getAllInvoices(filters?: any): Promise<any[]> {
    const response = await this.api.get('/invoices', { params: filters });
    return transformKeysToCAmelCase(response.data);
  }

  async getInvoiceById(id: string): Promise<any> {
    const response = await this.api.get(`/invoices/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async getNextInvoiceNumber(): Promise<string> {
    const response = await this.api.get('/invoices/next-number');
    return response.data.nextNumber;
  }

  async getInvoiceProjectContext(projectCode: string): Promise<any> {
    const response = await this.api.get(`/invoices/project/${projectCode}/context`);
    return transformKeysToCAmelCase(response.data);
  }

  async createInvoice(invoice: any): Promise<any> {
    const response = await this.api.post('/invoices', invoice);
    return transformKeysToCAmelCase(response.data);
  }

  async updateInvoice(id: string, updates: any): Promise<any> {
    const response = await this.api.put(`/invoices/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.api.delete(`/invoices/${id}`);
  }

  async downloadInvoicePDF(id: string): Promise<Blob> {
    const response = await this.api.get(`/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ==================== Issued POs (Outgoing) ====================

  async getAllIssuedPOs(filters?: any): Promise<any[]> {
    const response = await this.api.get('/issued-pos', { params: filters });
    return transformKeysToCAmelCase(response.data);
  }

  async getIssuedPOById(id: string): Promise<any> {
    const response = await this.api.get(`/issued-pos/${id}`);
    return transformKeysToCAmelCase(response.data);
  }

  async getNextIssuedPONumber(): Promise<string> {
    const response = await this.api.get('/issued-pos/next-number');
    return response.data.nextNumber;
  }

  async createIssuedPO(issuedPO: any): Promise<any> {
    const response = await this.api.post('/issued-pos', issuedPO);
    return transformKeysToCAmelCase(response.data);
  }

  async updateIssuedPO(id: string, updates: any): Promise<any> {
    const response = await this.api.put(`/issued-pos/${id}`, updates);
    return transformKeysToCAmelCase(response.data);
  }

  async deleteIssuedPO(id: string): Promise<void> {
    await this.api.delete(`/issued-pos/${id}`);
  }

  async downloadIssuedPOPDF(id: string): Promise<Blob> {
    const response = await this.api.get(`/issued-pos/${id}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // ==================== Project Hourly Rates ====================

  async getProjectHourlyRates(projectId: string): Promise<any[]> {
    const response = await this.api.get(`/project-hourly-rates/${projectId}`);
    return response.data?.data || [];
  }

  async saveProjectHourlyRates(projectId: string, rates: Record<string, number>): Promise<any> {
    const response = await this.api.put(`/project-hourly-rates/${projectId}`, { rates });
    return response.data;
  }

  async deleteProjectHourlyRate(projectId: string, teamMemberId: string): Promise<void> {
    await this.api.delete(`/project-hourly-rates/${projectId}/${teamMemberId}`);
  }

  // ==================== Categories ===================

  async getAllCategories(): Promise<any[]> {
    const response = await this.api.get('/categories');
    return response.data || [];
  }

  async getCategoryById(id: string): Promise<any> {
    const response = await this.api.get(`/categories/${id}`);
    return response.data;
  }

  async createCategory(data: { name: string; description?: string }): Promise<any> {
    const response = await this.api.post('/categories', data);
    return response.data;
  }

  async updateCategory(id: string, data: Partial<{ name: string; description: string }>): Promise<any> {
    const response = await this.api.put(`/categories/${id}`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.api.delete(`/categories/${id}`);
  }
}

// Export singleton instance
export default new ApiService();

// Also export named functions for backward compatibility
export const {
  login,
  logout,
  changePassword,
  getInventoryItems,
  getInventoryById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  bulkCreateInventoryItems,
  createSingleCheckout,
  createBulkCheckout,
  checkInSingle,
  checkInBulk,
  getAllCheckouts,
  getCheckoutByMasterBarcode,
  getAllMaintenanceTickets,
  createMaintenanceTicket,
  updateMaintenanceTicket,
  deleteMaintenanceTicket,
  getMaintenanceTicketById,
  createActivityLog,
  getRecentActivity,
  getAllActivity,
  getActivityById,
  getActivityByUser,
  getActivityByModule,
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  uploadProjectPO,
  deleteProjectPO,
  downloadProjectPO,
  getTimesheets,
  createTimesheet,
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getAllTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  getTeamByDepartment,
  getAllComputers,
  getComputerById,
  createComputer,
  updateComputer,
  deleteComputer,
  getComputersAssignedTo,
  assignComputerToUser,
  unassignComputer,
  getAllResearchProjects,
  getResearchProjectById,
  createResearchProject,
  updateResearchProject,
  deleteResearchProject,
  getResearchProjectsByStatus,
  uploadMigrationFile,
  executeMigration,
  getMigrationTemplate,
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  getAllInvoices,
  getInvoiceById,
  getNextInvoiceNumber,
  getInvoiceProjectContext,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoicePDF,
  getAllIssuedPOs,
  getIssuedPOById,
  getNextIssuedPONumber,
  createIssuedPO,
  updateIssuedPO,
  deleteIssuedPO,
  downloadIssuedPOPDF,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = new ApiService();
