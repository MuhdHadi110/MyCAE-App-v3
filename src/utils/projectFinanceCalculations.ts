import type { ProjectFinance, BaseCostBreakdown, CostBreakdown, RevenueDataPoint } from '../types/projectFinance.types';
import type { Project, Timesheet } from '../types/project.types';
import type { TeamMember } from '../types/team.types';

/**
 * Invoice data structure for calculations
 */
interface InvoiceData {
  id: string;
  projectCode: string;
  amountMyr: number;
  status: string;
}

/**
 * Calculate project finances from real data
 */
export function calculateProjectFinances(
  projects: Project[],
  timesheets: Timesheet[],
  teamMembers: TeamMember[],
  projectRates: Record<string, Record<string, number>>,
  projectPOs: Record<string, any[]>,
  invoices: InvoiceData[] = []
): ProjectFinance[] {
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];
  const safeInvoices = Array.isArray(invoices) ? invoices : [];

  return projects.map((project) => {
    // Get timesheets for this project
    const projectTimesheets = safeTimesheets.filter(ts => ts.projectId.toString() === project.id);
    const actualHours = projectTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours.toString() || '0'), 0);

    // Calculate base cost from timesheets
    let baseCost = 0;
    projectTimesheets.forEach(ts => {
      const engineer = teamMembers.find(tm => tm.id === ts.engineerId.toString());

      // Priority 1: Project daily rate (if set) - convert to hourly
      const hourlyRate = project.dailyRate
        ? (project.dailyRate as number) / 8 // Convert daily to hourly
        : (
          // Priority 2: Engineer hourly rate (if set)
          projectRates[project.id]?.[ts.engineerId.toString()]
          ?? engineer?.hourlyRate
          // Priority 3: Global rate: RM 437.50/hr
          ?? 437.50
        );

      baseCost += parseFloat(ts.hours.toString() || '0') * hourlyRate;
    });

    // Total cost is ONLY base cost (based on actual timesheets)
    const totalCost = baseCost;

    // Calculate revenue from purchase orders (active POs only)
    const projectPOList = projectPOs[project.projectCode] || [];
    const receivedPOs = projectPOList.reduce((sum, po) => {
      // Use effective amount (adjusted if present, else calculated)
      const effectiveAmount = po.amountMyrAdjusted
        ? parseFloat(po.amountMyrAdjusted.toString())
        : parseFloat(po.amountMyr.toString());
      return sum + effectiveAmount;
    }, 0);
    const totalRevenue = receivedPOs;

    // Calculate invoiced amount from invoices
    const projectInvoices = safeInvoices.filter(inv => inv.projectCode === project.projectCode);
    const invoiced = projectInvoices.reduce((sum, inv) => {
      return sum + parseFloat((inv.amountMyr || 0).toString());
    }, 0);

    // Calculate paid amount (invoices with 'paid' status)
    const paid = projectInvoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat((inv.amountMyr || 0).toString()), 0);

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;

    const averageRate = actualHours > 0 ? baseCost / actualHours : 0;

    return {
      projectId: project.id,
      projectCode: project.projectCode,
      projectTitle: project.title,
      clientName: project.companyName || 'Unknown Client',
      status: project.status,
      totalRevenue,
      receivedPOs,
      invoiced,
      paid,
      equipmentCost: 0, // Not tracked - only base costs
      softwareCost: 0, // Not tracked - only base costs
      baseCost,
      overheadCost: 0, // Not tracked - only base costs
      totalCost,
      grossProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      budgetedHours: project.plannedHours,
      actualHours,
      averageHourlyRate: Math.round(averageRate * 100) / 100,
      startDate: project.startDate,
      endDate: project.endDate,
    };
  });
}

/**
 * Calculate base cost breakdown per project
 */
export function calculateBaseCostBreakdowns(
  projects: Project[],
  timesheets: Timesheet[],
  teamMembers: TeamMember[],
  projectRates: Record<string, Record<string, number>>
): Record<string, BaseCostBreakdown[]> {
  const breakdowns: Record<string, BaseCostBreakdown[]> = {};
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];

  projects.forEach((project) => {
    const projectTimesheets = safeTimesheets.filter(ts => ts.projectId.toString() === project.id);

    // Group by engineer
    const engineerHours: Record<string, { hours: number; engineer: TeamMember | undefined }> = {};

    projectTimesheets.forEach(ts => {
      const engineerIdStr = ts.engineerId.toString();
      if (!engineerHours[engineerIdStr]) {
        // Match against userId (user.id) instead of team member id, since timesheets reference users table
        const engineer = teamMembers.find(tm => tm.userId?.toString() === engineerIdStr);
        engineerHours[engineerIdStr] = {
          hours: 0,
          engineer,
        };
      }
      engineerHours[engineerIdStr].hours += parseFloat(ts.hours.toString() || '0');
    });

    // Convert to breakdown format
    breakdowns[project.id] = Object.entries(engineerHours).map(([engineerId, data]) => {
      const engineer = data.engineer;
      // Use project-specific rate if available, otherwise use team member's rate, fallback to 75
      const projectRate = projectRates[project.id]?.[engineerId];
      const rate = projectRate ?? engineer?.hourlyRate ?? 75;
      return {
        engineerId,
        engineerName: engineer?.name || 'Unknown',
        role: engineer?.role || 'engineer',
        hoursLogged: data.hours,
        hourlyRate: rate,
        totalCost: data.hours * rate,
      };
    });
  });

  return breakdowns;
}

/**
 * Calculate aggregate cost breakdown - Only base costs
 */
export function calculateCostBreakdown(projectFinances: ProjectFinance[]): CostBreakdown[] {
  const totalBaseCosts = projectFinances.reduce((acc, proj) => acc + proj.baseCost, 0);

  if (totalBaseCosts === 0) return [];

  // Only base costs tracked
  return [
    { category: 'Base Cost', amount: totalBaseCosts, percentage: 100 },
  ];
}

/**
 * Calculate summary stats
 */
export function calculateSummaryStats(filteredProjects: ProjectFinance[]) {
  const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalCost = filteredProjects.reduce((sum, p) => sum + p.totalCost, 0);
  const totalProfit = filteredProjects.reduce((sum, p) => sum + p.grossProfit, 0);
  const avgMargin = filteredProjects.length > 0
    ? filteredProjects.reduce((sum, p) => sum + p.profitMargin, 0) / filteredProjects.length
    : 0;

  return { totalRevenue, totalCost, totalProfit, avgMargin };
}

/**
 * Filter projects based on search and status
 */
export function filterProjects(
  projects: ProjectFinance[],
  statusFilter: string,
  searchQuery: string
): ProjectFinance[] {
  let filtered = projects;

  // Apply status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter(p => p.status === statusFilter);
  }

  // Apply search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      p.projectCode.toLowerCase().includes(query) ||
      p.projectTitle.toLowerCase().includes(query) ||
      p.clientName.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Generate mock revenue data (placeholder for future real data)
 */
export function generateMockRevenueData(): RevenueDataPoint[] {
  return [];
}