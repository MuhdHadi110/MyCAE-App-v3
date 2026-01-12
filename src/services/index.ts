/**
 * Services Index
 *
 * Convenient re-exports of all domain-specific services.
 *
 * USAGE:
 * import { authService, financeService, teamService } from '@/services';
 */

export { default as authService } from './auth.service';
export { default as financeService } from './finance.service';
export { default as teamService } from './team.service';
export { default as inventoryService } from './inventory.service';
export { default as projectService } from './project.service';
export { default as timesheetService } from './timesheet.service';
export { default as computerService } from './computer.service';
export { default as researchService } from './research.service';
export { default as activityService } from './activity.service';

// Export HTTP client for advanced use cases
export { httpClient, api } from './http-client';

// Legacy API service for backward compatibility (deprecated - use domain services)
export { default as apiService } from './api.service';
