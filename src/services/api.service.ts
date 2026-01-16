/**
 * API Service - Legacy Compatibility Layer
 *
 * This file maintains backward compatibility with existing code.
 * All methods now delegate to domain-specific services.
 *
 * MIGRATION GUIDE:
 * Instead of: import apiService from './services/api.service';
 * Use: import authService from './services/auth.service';
 *      import financeService from './services/finance.service';
 *      ... etc.
 */

import { httpClient } from './http-client';
import authService from './auth.service';
import inventoryService from './inventory.service';
import projectService from './project.service';
import timesheetService from './timesheet.service';
import teamService from './team.service';
import computerService from './computer.service';
import researchService from './research.service';
import financeService from './finance.service';
import activityService from './activity.service';

import type { InventoryItem, BulkCheckout } from '../types/inventory.types';
import type { ExtendedCheckout } from '../types/checkout.types';
import type { MaintenanceTicket } from '../types/maintenance.types';

class ApiService {
  // Expose HTTP client methods
  setAuthToken(token: string) {
    httpClient.setAuthToken(token);
  }

  clearAuth() {
    httpClient.clearAuth();
  }

  isProduction(): boolean {
    return httpClient.isProduction();
  }

  getEnvironmentInfo(): { isProduction: boolean; url: string } {
    return httpClient.getEnvironmentInfo();
  }

  // ==================== Authentication (delegates to authService) ====================

  async register(data: { name: string; email: string; password: string; role?: string }) {
    return authService.register(data);
  }

  async login(email: string, password: string, captchaToken?: string) {
    return authService.login(email, password, captchaToken);
  }

  async logout() {
    return authService.logout();
  }

  async changePassword(email: string, currentPassword: string, newPassword: string) {
    return authService.changePassword(email, currentPassword, newPassword);
  }

  async updateUserAvatar(avatarId: string) {
    return authService.updateUserAvatar(avatarId);
  }

  async getCurrentUserProfile() {
    return authService.getCurrentUserProfile();
  }

  // ==================== Inventory (delegates to inventoryService) ====================

  async getInventoryItems(filters?: {
    category?: string;
    status?: string;
    lowStock?: boolean;
    search?: string;
  }): Promise<InventoryItem[]> {
    return inventoryService.getInventoryItems(filters);
  }

  async getInventoryById(id: string): Promise<InventoryItem> {
    return inventoryService.getInventoryById(id);
  }

  async createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    return inventoryService.createInventoryItem(item);
  }

  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    return inventoryService.updateInventoryItem(id, updates);
  }

  async deleteInventoryItem(id: string): Promise<void> {
    return inventoryService.deleteInventoryItem(id);
  }

  async bulkCreateInventoryItems(items: Array<Omit<InventoryItem, 'id'>>) {
    return inventoryService.bulkCreateInventoryItems(items);
  }

  // ==================== Checkouts (delegates to inventoryService) ====================

  async createSingleCheckout(checkout: any) {
    return inventoryService.createSingleCheckout(checkout);
  }

  async createBulkCheckout(checkout: BulkCheckout) {
    return inventoryService.createBulkCheckout(checkout);
  }

  async checkInSingle(checkIn: any) {
    return inventoryService.checkInSingle(checkIn);
  }

  async checkInBulk(checkIn: any) {
    return inventoryService.checkInBulk(checkIn);
  }

  async getAllCheckouts(): Promise<ExtendedCheckout[]> {
    return inventoryService.getAllCheckouts();
  }

  async getCheckoutByMasterBarcode(masterBarcode: string) {
    return inventoryService.getCheckoutByMasterBarcode(masterBarcode);
  }

  // ==================== Maintenance (delegates to inventoryService) ====================

  async getAllMaintenanceTickets(): Promise<MaintenanceTicket[]> {
    return inventoryService.getAllMaintenanceTickets();
  }

  async createMaintenanceTicket(ticket: Omit<MaintenanceTicket, 'id'>): Promise<MaintenanceTicket> {
    return inventoryService.createMaintenanceTicket(ticket);
  }

  async updateMaintenanceTicket(id: string, updates: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> {
    return inventoryService.updateMaintenanceTicket(id, updates);
  }

  async deleteMaintenanceTicket(id: string): Promise<void> {
    return inventoryService.deleteMaintenanceTicket(id);
  }

  async getMaintenanceTicketById(id: string): Promise<MaintenanceTicket> {
    return inventoryService.getMaintenanceTicketById(id);
  }

  // ==================== Activity (delegates to activityService) ====================

  async createActivityLog(activity: {
    action: string;
    description: string;
    user: string;
    timestamp: string;
  }) {
    return activityService.createActivityLog(activity);
  }

  async getRecentActivity(limit: number = 10) {
    return activityService.getRecentActivity(limit);
  }

  async getAllActivity(filters?: any) {
    return activityService.getAllActivity(filters);
  }

  async getActivityById(id: string) {
    return activityService.getActivityById(id);
  }

  async getActivityByUser(userId: string, filters?: any) {
    return activityService.getActivityByUser(userId, filters);
  }

  async getActivityByModule(module: string, filters?: any) {
    return activityService.getActivityByModule(module, filters);
  }

  // ==================== Projects (delegates to projectService) ====================

  async getProjects(filters?: any) {
    return projectService.getProjects(filters);
  }

  async getProjectById(id: string) {
    return projectService.getProjectById(id);
  }

  async createProject(project: any) {
    return projectService.createProject(project);
  }

  async updateProject(id: string, updates: any) {
    return projectService.updateProject(id, updates);
  }

  async deleteProject(id: string) {
    return projectService.deleteProject(id);
  }

  async updateProjectStatus(id: string, status: string, dateField?: { field: string; value: string }) {
    return projectService.updateProjectStatus(id, status, dateField);
  }

  async uploadProjectPO(id: string, file: File) {
    return projectService.uploadProjectPO(id, file);
  }

  async deleteProjectPO(id: string) {
    return projectService.deleteProjectPO(id);
  }

  async downloadProjectPO(fileUrl: string) {
    return projectService.downloadProjectPO(fileUrl);
  }

  async getProjectHourlyRates(projectId: string) {
    return projectService.getProjectHourlyRates(projectId);
  }

  async saveProjectHourlyRates(projectId: string, rates: Record<string, number>) {
    return projectService.saveProjectHourlyRates(projectId, rates);
  }

  async deleteProjectHourlyRate(projectId: string, teamMemberId: string) {
    return projectService.deleteProjectHourlyRate(projectId, teamMemberId);
  }

  async uploadMigrationFile(file: File) {
    return projectService.uploadMigrationFile(file);
  }

  async executeMigration(projects: any[]) {
    return projectService.executeMigration(projects);
  }

  async getMigrationTemplate() {
    return projectService.getMigrationTemplate();
  }

  // ==================== Timesheets (delegates to timesheetService) ====================

  async getTimesheets(filters?: any) {
    return timesheetService.getTimesheets(filters);
  }

  async createTimesheet(timesheet: any) {
    return timesheetService.createTimesheet(timesheet);
  }

  async updateTimesheet(id: string, updates: any) {
    return timesheetService.updateTimesheet(id, updates);
  }

  async deleteTimesheet(id: string) {
    return timesheetService.deleteTimesheet(id);
  }

  // ==================== Clients (delegates to timesheetService) ====================

  async getAllClients(filters?: any) {
    return timesheetService.getAllClients(filters);
  }

  async getClientById(id: string) {
    return timesheetService.getClientById(id);
  }

  async createClient(client: any) {
    return timesheetService.createClient(client);
  }

  async updateClient(id: string, updates: any) {
    return timesheetService.updateClient(id, updates);
  }

  async deleteClient(id: string) {
    return timesheetService.deleteClient(id);
  }

  // ==================== Team (delegates to teamService) ====================

  async getAllTeamMembers(filters?: any) {
    return teamService.getAllTeamMembers(filters);
  }

  async getTeamMemberById(id: string) {
    return teamService.getTeamMemberById(id);
  }

  async createTeamMember(member: any) {
    return teamService.createTeamMember(member);
  }

  async updateTeamMember(id: string, updates: any) {
    return teamService.updateTeamMember(id, updates);
  }

  async deleteTeamMember(id: string) {
    return teamService.deleteTeamMember(id);
  }

  async reactivateTeamMember(id: string) {
    return teamService.reactivateTeamMember(id);
  }

  async updateTeamMemberAvatar(teamMemberId: string, avatarId: string) {
    return teamService.updateTeamMemberAvatar(teamMemberId, avatarId);
  }

  async getTeamByDepartment(department: string, filters?: any) {
    return teamService.getTeamByDepartment(department, filters);
  }

  // ==================== Computers (delegates to computerService) ====================

  async getAllComputers(filters?: any) {
    return computerService.getAllComputers(filters);
  }

  async getComputerById(id: string) {
    return computerService.getComputerById(id);
  }

  async createComputer(computer: any) {
    return computerService.createComputer(computer);
  }

  async updateComputer(id: string, updates: any) {
    return computerService.updateComputer(id, updates);
  }

  async deleteComputer(id: string) {
    return computerService.deleteComputer(id);
  }

  async getComputersAssignedTo(userId: string, filters?: any) {
    return computerService.getComputersAssignedTo(userId, filters);
  }

  async assignComputerToUser(
    computerId: string,
    userId: string,
    installedSoftware?: string[],
    notes?: string
  ) {
    return computerService.assignComputerToUser(computerId, userId, installedSoftware, notes);
  }

  async unassignComputer(computerId: string) {
    return computerService.unassignComputer(computerId);
  }

  async setMaintenanceStatus(computerId: string, inMaintenance: boolean) {
    return computerService.setMaintenanceStatus(computerId, inMaintenance);
  }

  // ==================== Research (delegates to researchService) ====================

  async getAllResearchProjects(filters?: any) {
    return researchService.getAllResearchProjects(filters);
  }

  async getResearchProjectById(id: string) {
    return researchService.getResearchProjectById(id);
  }

  async createResearchProject(project: any) {
    return researchService.createResearchProject(project);
  }

  async updateResearchProject(id: string, updates: any) {
    return researchService.updateResearchProject(id, updates);
  }

  async deleteResearchProject(id: string) {
    return researchService.deleteResearchProject(id);
  }

  async getResearchProjectsByStatus(status: string, filters?: any) {
    return researchService.getResearchProjectsByStatus(status, filters);
  }

  async logResearchTimesheet(entry: any) {
    return researchService.logResearchTimesheet(entry);
  }

  async approveResearchTimesheet(entryId: string, approvedBy: string) {
    return researchService.approveResearchTimesheet(entryId, approvedBy);
  }

  async deleteResearchTimesheet(entryId: string) {
    return researchService.deleteResearchTimesheet(entryId);
  }

  async getResearchTimesheets(filters?: {
    projectId?: string;
    teamMemberId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return researchService.getResearchTimesheets(filters);
  }

  // ==================== Finance (delegates to financeService) ====================

  // Purchase Orders
  async getAllPurchaseOrders(filters?: any) {
    return financeService.getAllPurchaseOrders(filters);
  }

  async getPurchaseOrderById(id: string) {
    return financeService.getPurchaseOrderById(id);
  }

  async createPurchaseOrder(data: {
    poNumber: string;
    projectCode: string;
    clientName: string;
    amount: number | string;
    currency?: string;
    receivedDate: Date | string;
    dueDate?: Date | string;
    description?: string;
    status?: string;
    fileUrl?: string;
    plannedHours?: number;
    customExchangeRate?: number;
  }) {
    return financeService.createPurchaseOrder(data);
  }

  async updatePurchaseOrder(id: string, updates: any) {
    return financeService.updatePurchaseOrder(id, updates);
  }

  async deletePurchaseOrder(id: string) {
    return financeService.deletePurchaseOrder(id);
  }

  async uploadPurchaseOrderFile(formData: FormData) {
    return financeService.uploadPurchaseOrderFile(formData);
  }

  async downloadPurchaseOrderFile(filename: string) {
    return financeService.downloadPurchaseOrderFile(filename);
  }

  async getPurchaseOrders(filters?: any) {
    return financeService.getPurchaseOrders(filters);
  }

  // PO Revisions
  async getPORevisions(poNumberBase: string) {
    return financeService.getPORevisions(poNumberBase);
  }

  async createPORevision(
    poId: string,
    data: {
      amount: number;
      currency: string;
      receivedDate: Date | string;
      description?: string;
      fileUrl?: string;
      revisionReason: string;
    }
  ) {
    return financeService.createPORevision(poId, data);
  }

  async adjustPOMYRAmount(poId: string, adjustedAmount: number, reason: string) {
    return financeService.adjustPOMYRAmount(poId, adjustedAmount, reason);
  }

  // Invoices
  async getAllInvoices(filters?: any) {
    return financeService.getAllInvoices(filters);
  }

  async getInvoiceById(id: string) {
    return financeService.getInvoiceById(id);
  }

  async getNextInvoiceNumber() {
    return financeService.getNextInvoiceNumber();
  }

  async getInvoiceProjectContext(projectCode: string) {
    return financeService.getInvoiceProjectContext(projectCode);
  }

  async createInvoice(invoice: any) {
    return financeService.createInvoice(invoice);
  }

  async updateInvoice(id: string, updates: any) {
    return financeService.updateInvoice(id, updates);
  }

  async deleteInvoice(id: string) {
    return financeService.deleteInvoice(id);
  }

  async downloadInvoicePDF(id: string) {
    return financeService.downloadInvoicePDF(id);
  }

  // Issued POs
  async getAllIssuedPOs(filters?: any) {
    return financeService.getAllIssuedPOs(filters);
  }

  async getIssuedPOById(id: string) {
    return financeService.getIssuedPOById(id);
  }

  async getNextIssuedPONumber() {
    return financeService.getNextIssuedPONumber();
  }

  async createIssuedPO(issuedPO: any) {
    return financeService.createIssuedPO(issuedPO);
  }

  async updateIssuedPO(id: string, updates: any) {
    return financeService.updateIssuedPO(id, updates);
  }

  async deleteIssuedPO(id: string) {
    return financeService.deleteIssuedPO(id);
  }

  async downloadIssuedPOPDF(id: string) {
    return financeService.downloadIssuedPOPDF(id);
  }

  // Categories
  async getAllCategories() {
    return financeService.getAllCategories();
  }

  async getCategoryById(id: string) {
    return financeService.getCategoryById(id);
  }

  async createCategory(data: { name: string; description?: string }) {
    return financeService.createCategory(data);
  }

  async updateCategory(id: string, data: Partial<{ name: string; description: string }>) {
    return financeService.updateCategory(id, data);
  }

  async deleteCategory(id: string) {
    return financeService.deleteCategory(id);
  }

  // Exchange Rates
  async getExchangeRates() {
    return financeService.getExchangeRates();
  }

  async createExchangeRate(data: { fromCurrency: string; rate: number; effectiveDate: string }) {
    return financeService.createExchangeRate(data);
  }

  async importExchangeRates() {
    return financeService.importExchangeRates();
  }

  async convertCurrency(amount: number, fromCurrency: string) {
    return financeService.convertCurrency(amount, fromCurrency);
  }
}

// Export singleton instance
export default new ApiService();

// Named exports for backward compatibility
const service = new ApiService();

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
  getExchangeRates,
  createExchangeRate,
  importExchangeRates,
  convertCurrency,
} = service;
