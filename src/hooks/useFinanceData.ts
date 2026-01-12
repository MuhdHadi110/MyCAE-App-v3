import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useTeamStore } from '../store/teamStore';
import financeService from '../services/finance.service';
import projectService from '../services/project.service';
import { FIXED_HOURLY_RATE } from '../constants/finance';
import type {
  ProjectFinanceSummary,
  FinanceTotals,
  EngineerCost,
  PurchaseOrderData,
  InvoiceData,
  OriginalCurrencyAmount,
} from '../types/financeOverview.types';
import type { Project, Timesheet } from '../types/project.types';
import type { TeamMember } from '../types/team.types';

/**
 * Custom hook for fetching and computing finance overview data
 * Provides simplified PO Received vs Invoiced view with man-hour costs
 */
export function useFinanceData() {
  const { projects, timesheets, fetchProjects, fetchTimesheets, loading: projectsLoading } = useProjectStore();
  const { teamMembers, fetchTeamMembers, loading: teamLoading } = useTeamStore();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [projectRates, setProjectRates] = useState<Record<string, Record<string, number>>>({});
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all required data
  const fetchAllData = useCallback(async () => {
    setDataLoading(true);
    setError(null);

    try {
      // Fetch data in parallel
      // Note: Purchase orders endpoint defaults to active only (is_active=true)
      const [posResponse, invoicesResponse] = await Promise.all([
        financeService.getAllPurchaseOrders(),
        financeService.getAllInvoices(),
        fetchProjects(),
        fetchTimesheets(),
        fetchTeamMembers(),
      ]);

      // Handle POs response (may be array or object with data property)
      const posData = Array.isArray(posResponse)
        ? posResponse
        : (posResponse?.data || posResponse || []);
      setPurchaseOrders(posData);

      // Handle invoices response
      setInvoices(Array.isArray(invoicesResponse) ? invoicesResponse : []);

      // Fetch project-specific hourly rates for all projects
      const allRates: Record<string, Record<string, number>> = {};
      const projectsData = useProjectStore.getState().projects;

      // Fetch rates in batches to avoid too many concurrent requests
      const ratePromises = projectsData.map(async (project) => {
        try {
          const rates = await projectService.getProjectHourlyRates(project.id);
          allRates[project.id] = {};
          rates.forEach((rate: any) => {
            allRates[project.id][rate.teamMemberId] = parseFloat(rate.hourlyRate);
          });
        } catch {
          // Ignore errors for individual rate fetches
        }
      });

      await Promise.all(ratePromises);
      setProjectRates(allRates);
    } catch (err: any) {
      console.error('Failed to fetch finance data:', err);
      setError(err?.message || 'Failed to load finance data');
    } finally {
      setDataLoading(false);
    }
  }, [fetchProjects, fetchTimesheets, fetchTeamMembers]);

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Calculate project summaries
  const projectSummaries = useMemo(() => {
    return calculateProjectSummaries(
      projects,
      purchaseOrders,
      invoices,
      timesheets,
      teamMembers,
      projectRates
    );
  }, [projects, purchaseOrders, invoices, timesheets, teamMembers, projectRates]);

  // Calculate totals for summary cards
  const totals = useMemo(() => {
    return calculateTotals(projectSummaries, purchaseOrders, invoices);
  }, [projectSummaries, purchaseOrders, invoices]);

  const loading = dataLoading || projectsLoading || teamLoading;

  return {
    projectSummaries,
    totals,
    loading,
    error,
    refetch: fetchAllData,
  };
}

/**
 * Calculate financial summaries for each project
 */
function calculateProjectSummaries(
  projects: Project[],
  purchaseOrders: PurchaseOrderData[],
  invoices: InvoiceData[],
  timesheets: Timesheet[],
  teamMembers: TeamMember[],
  projectRates: Record<string, Record<string, number>>
): ProjectFinanceSummary[] {
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];

  return projects.map((project) => {
    // Get POs for this project (by project_code)
    const projectPOs = purchaseOrders.filter(
      (po) => po.project_code === project.projectCode && po.is_active
    );

    // Get invoices for this project
    const projectInvoices = invoices.filter(
      (inv) => inv.project_code === project.projectCode
    );

    // Calculate PO received (MYR)
    const poReceived = projectPOs.reduce((sum, po) => {
      const effectiveAmount = po.amount_myr_adjusted
        ? parseFloat(po.amount_myr_adjusted.toString())
        : parseFloat((po.amount_myr || 0).toString());
      return sum + effectiveAmount;
    }, 0);

    // Original currency breakdown for POs
    const poReceivedOriginal: OriginalCurrencyAmount[] = projectPOs.map((po) => ({
      amount: parseFloat(po.amount.toString()),
      currency: po.currency || 'MYR',
      amountMyr: po.amount_myr_adjusted
        ? parseFloat(po.amount_myr_adjusted.toString())
        : parseFloat((po.amount_myr || 0).toString()),
    }));

    // Calculate invoiced (MYR)
    const invoiced = projectInvoices.reduce((sum, inv) => {
      return sum + parseFloat((inv.amount_myr || 0).toString());
    }, 0);

    // Original currency breakdown for invoices
    const invoicedOriginal: OriginalCurrencyAmount[] = projectInvoices.map((inv) => ({
      amount: parseFloat(inv.amount.toString()),
      currency: inv.currency || 'MYR',
      amountMyr: parseFloat((inv.amount_myr || 0).toString()),
    }));

    // Calculate outstanding
    const outstanding = poReceived - invoiced;

    // Get timesheets for this project
    const projectTimesheets = safeTimesheets.filter(
      (ts) => ts.projectId.toString() === project.id
    );

    // Calculate actual hours
    const actualHours = projectTimesheets.reduce(
      (sum, ts) => sum + parseFloat(ts.hours.toString() || '0'),
      0
    );

    // Calculate man-hour cost and engineer breakdown
    const engineerHoursMap: Record<string, { hours: number; engineer: TeamMember | undefined }> = {};

    projectTimesheets.forEach((ts) => {
      const engineerIdStr = ts.engineerId.toString();
      if (!engineerHoursMap[engineerIdStr]) {
        const engineer = teamMembers.find((tm) => tm.id === engineerIdStr);
        engineerHoursMap[engineerIdStr] = { hours: 0, engineer };
      }
      engineerHoursMap[engineerIdStr].hours += parseFloat(ts.hours.toString() || '0');
    });

    // Build engineer breakdown with costs
    // Using fixed hourly rate of RM 437.50/hour (RM 3,500/day / 8 hours)
    const engineerBreakdown: EngineerCost[] = Object.entries(engineerHoursMap).map(
      ([engineerId, data]) => {
        const engineer = data.engineer;

        return {
          engineerId,
          engineerName: engineer?.name || 'Unknown',
          role: engineer?.role || 'engineer',
          hours: data.hours,
          hourlyRate: FIXED_HOURLY_RATE,
          totalCost: data.hours * FIXED_HOURLY_RATE,
        };
      }
    );

    // Calculate total man-hour cost
    const manHourCost = engineerBreakdown.reduce((sum, eng) => sum + eng.totalCost, 0);

    return {
      projectId: project.id,
      projectCode: project.projectCode,
      projectTitle: project.title,
      clientName: project.clientName || 'Unknown Client',
      status: project.status,
      poReceived,
      invoiced,
      outstanding,
      poReceivedOriginal,
      invoicedOriginal,
      manHourCost,
      actualHours,
      engineerBreakdown,
    };
  });
}

/**
 * Calculate aggregate totals for summary cards
 */
function calculateTotals(
  projectSummaries: ProjectFinanceSummary[],
  purchaseOrders: PurchaseOrderData[],
  invoices: InvoiceData[]
): FinanceTotals {
  const totalPOReceived = projectSummaries.reduce((sum, p) => sum + p.poReceived, 0);
  const totalInvoiced = projectSummaries.reduce((sum, p) => sum + p.invoiced, 0);
  const totalOutstanding = totalPOReceived - totalInvoiced;
  const totalManHourCost = projectSummaries.reduce((sum, p) => sum + p.manHourCost, 0);

  // Group PO amounts by currency (original amounts)
  const poReceivedByCurrency: Record<string, number> = {};
  purchaseOrders
    .filter((po) => po.is_active)
    .forEach((po) => {
      const currency = po.currency || 'MYR';
      const amount = parseFloat(po.amount.toString());
      poReceivedByCurrency[currency] = (poReceivedByCurrency[currency] || 0) + amount;
    });

  // Group invoice amounts by currency (original amounts)
  const invoicedByCurrency: Record<string, number> = {};
  invoices.forEach((inv) => {
    const currency = inv.currency || 'MYR';
    const amount = parseFloat(inv.amount.toString());
    invoicedByCurrency[currency] = (invoicedByCurrency[currency] || 0) + amount;
  });

  return {
    totalPOReceived,
    totalInvoiced,
    totalOutstanding,
    totalManHourCost,
    poReceivedByCurrency,
    invoicedByCurrency,
  };
}

/**
 * Filter projects based on search query and status
 */
export function filterProjectSummaries(
  projects: ProjectFinanceSummary[],
  statusFilter: string,
  searchQuery: string
): ProjectFinanceSummary[] {
  let filtered = projects;

  // Apply status filter
  if (statusFilter !== 'all') {
    filtered = filtered.filter((p) => p.status === statusFilter);
  }

  // Apply search query
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.projectCode.toLowerCase().includes(query) ||
        p.projectTitle.toLowerCase().includes(query) ||
        p.clientName.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Format currency amount based on display mode
 */
export function formatFinanceAmount(
  amountMyr: number,
  originalAmounts: OriginalCurrencyAmount[],
  showOriginal: boolean
): string {
  if (!showOriginal || originalAmounts.length === 0) {
    return `RM ${amountMyr.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // If showing original and there's only one currency
  if (originalAmounts.length === 1) {
    const { amount, currency } = originalAmounts[0];
    return formatCurrencyAmount(amount, currency);
  }

  // Multiple currencies - show "Mixed" or the dominant one
  const currencyCounts: Record<string, number> = {};
  originalAmounts.forEach((oa) => {
    currencyCounts[oa.currency] = (currencyCounts[oa.currency] || 0) + 1;
  });

  const currencies = Object.keys(currencyCounts);
  if (currencies.length === 1) {
    const currency = currencies[0];
    const total = originalAmounts.reduce((sum, oa) => sum + oa.amount, 0);
    return formatCurrencyAmount(total, currency);
  }

  // Multiple currencies - show each
  return originalAmounts
    .map((oa) => formatCurrencyAmount(oa.amount, oa.currency))
    .join(' + ');
}

/**
 * Format a single currency amount
 */
export function formatCurrencyAmount(amount: number, currency: string): string {
  const symbols: Record<string, string> = {
    MYR: 'RM',
    USD: 'US$',
    SGD: 'S$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    JPY: '\u00A5',
    CNY: '\u00A5',
    AUD: 'A$',
    THB: '\u0E3F',
    IDR: 'Rp',
  };

  const symbol = symbols[currency] || currency;
  return `${symbol} ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format totals for summary cards with currency toggle
 */
export function formatTotalWithCurrency(
  totalMyr: number,
  byCurrency: Record<string, number>,
  showOriginal: boolean
): string {
  if (!showOriginal) {
    return `RM ${totalMyr.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const currencies = Object.keys(byCurrency);
  if (currencies.length === 0) {
    return `RM ${totalMyr.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (currencies.length === 1 && currencies[0] === 'MYR') {
    return `RM ${totalMyr.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Show breakdown by currency
  return currencies
    .map((currency) => formatCurrencyAmount(byCurrency[currency], currency))
    .join('\n');
}
