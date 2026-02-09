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
  IssuedPOData,
  ReceivedInvoiceData,
  OriginalCurrencyAmount,
} from '../types/financeOverview.types';
import type { Project, Timesheet } from '../types/project.types';
import type { TeamMember } from '../types/team.types';

/**
 * Helper function to check if a date is within the selected filter period
 * @param dateString - The date string to check
 * @param selectedYear - Selected year (0 = All Time)
 * @param selectedMonth - Selected month (0 = All Months)
 * @returns boolean - True if date is within the filter period
 */
function isDateInFilter(dateString: string, selectedYear: number, selectedMonth: number): boolean {
  if (selectedYear === 0) return true; // All Time - include everything
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  
  if (year !== selectedYear) return false;
  if (selectedMonth > 0 && month !== selectedMonth) return false;
  
  return true;
}

/**
 * Custom hook for fetching and computing finance overview data
 * Provides simplified PO Received vs Invoiced view with man-hour costs
 */
export function useFinanceData(selectedYear: number = 0, selectedMonth: number = 0) {
  const { projects, timesheets, fetchProjects, fetchTimesheets, loading: projectsLoading } = useProjectStore();
  const { teamMembers, fetchTeamMembers, loading: teamLoading } = useTeamStore();

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderData[]>([]);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [issuedPOs, setIssuedPOs] = useState<IssuedPOData[]>([]);
  const [receivedInvoices, setReceivedInvoices] = useState<ReceivedInvoiceData[]>([]);
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
      const [posResponse, invoicesResponse, issuedPOsResponse, receivedInvoicesResponse] = await Promise.all([
        financeService.getAllPurchaseOrders(),
        financeService.getAllInvoices(),
        financeService.getAllIssuedPOs(),
        financeService.getAllReceivedInvoices(),
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

      // Handle Issued POs (to vendors)
      const issuedPOsData = Array.isArray(issuedPOsResponse)
        ? issuedPOsResponse
        : ((issuedPOsResponse as any)?.data || []);
      setIssuedPOs(issuedPOsData);

      // Handle Received Invoices (from vendors)
      const receivedInvoicesData = Array.isArray(receivedInvoicesResponse)
        ? receivedInvoicesResponse
        : ((receivedInvoicesResponse as any)?.data || []);
      setReceivedInvoices(receivedInvoicesData);

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

  // Filter data by date before calculating summaries
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(po => isDateInFilter(po.receivedDate, selectedYear, selectedMonth));
  }, [purchaseOrders, selectedYear, selectedMonth]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => isDateInFilter(inv.invoiceDate, selectedYear, selectedMonth));
  }, [invoices, selectedYear, selectedMonth]);

  const filteredIssuedPOs = useMemo(() => {
    return issuedPOs.filter(po => isDateInFilter(po.issueDate, selectedYear, selectedMonth));
  }, [issuedPOs, selectedYear, selectedMonth]);

  const filteredReceivedInvoices = useMemo(() => {
    return receivedInvoices.filter(inv => isDateInFilter(inv.invoiceDate, selectedYear, selectedMonth));
  }, [receivedInvoices, selectedYear, selectedMonth]);

  // Calculate project summaries using filtered data
  const projectSummaries = useMemo(() => {
    return calculateProjectSummaries(
      projects,
      filteredPurchaseOrders,
      filteredInvoices,
      filteredIssuedPOs,
      filteredReceivedInvoices,
      timesheets,
      teamMembers,
      projectRates
    );
  }, [projects, filteredPurchaseOrders, filteredInvoices, filteredIssuedPOs, filteredReceivedInvoices, timesheets, teamMembers, projectRates]);

  // Calculate totals for summary cards using filtered data
  const totals = useMemo(() => {
    return calculateTotals(projectSummaries, filteredPurchaseOrders, filteredInvoices, filteredIssuedPOs, filteredReceivedInvoices);
  }, [projectSummaries, filteredPurchaseOrders, filteredInvoices, filteredIssuedPOs, filteredReceivedInvoices]);

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
  issuedPOs: IssuedPOData[],
  receivedInvoices: ReceivedInvoiceData[],
  timesheets: Timesheet[],
  teamMembers: TeamMember[],
  projectRates: Record<string, Record<string, number>>
): ProjectFinanceSummary[] {
  const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];

  return projects.map((project) => {
    // For parent projects, aggregate VOs as well
    const projectCodes = [project.projectCode];

    // If this is a parent project, include all VO codes
    if (!project.isVariationOrder && project.variationOrders?.length > 0) {
      project.variationOrders.forEach(vo => {
        projectCodes.push(vo.projectCode);
      });
    }

    // Get POs for this project AND all its VOs
    const projectPOs = purchaseOrders.filter(
      (po) => projectCodes.includes(po.projectCode) && po.isActive
    );

    // Get invoices for this project AND all its VOs
    const projectInvoices = invoices.filter(
      (inv) => projectCodes.includes(inv.projectCode)
    );

    // Calculate PO received (MYR) - fallback to amount if amountMyr is null/undefined
    const poReceived = projectPOs.reduce((sum, po) => {
      let effectiveAmount;
      if (po.amountMyrAdjusted !== null && po.amountMyrAdjusted !== undefined) {
        effectiveAmount = po.amountMyrAdjusted;
      } else if (po.amountMyr !== null && po.amountMyr !== undefined) {
        effectiveAmount = po.amountMyr;
      } else {
        effectiveAmount = po.amount; // Fallback to original amount
      }
      return sum + parseFloat((effectiveAmount || 0).toString());
    }, 0);

    // Original currency breakdown for POs
    const poReceivedOriginal: OriginalCurrencyAmount[] = projectPOs.map((po) => {
      let amountMyr;
      if (po.amountMyrAdjusted !== null && po.amountMyrAdjusted !== undefined) {
        amountMyr = po.amountMyrAdjusted;
      } else if (po.amountMyr !== null && po.amountMyr !== undefined) {
        amountMyr = po.amountMyr;
      } else {
        amountMyr = po.amount; // Fallback to original amount
      }
      return {
        amount: parseFloat(po.amount.toString()),
        currency: po.currency || 'MYR',
        amountMyr: parseFloat((amountMyr || 0).toString()),
      };
    });

    // Calculate invoiced (MYR) - fallback to amount if amountMyr is null/undefined
    const invoiced = projectInvoices.reduce((sum, inv) => {
      const amount = inv.amountMyr !== null && inv.amountMyr !== undefined
        ? inv.amountMyr
        : inv.amount; // Fallback to original amount
      return sum + parseFloat((amount || 0).toString());
    }, 0);

    // Original currency breakdown for invoices
    const invoicedOriginal: OriginalCurrencyAmount[] = projectInvoices.map((inv) => ({
      amount: parseFloat(inv.amount.toString()),
      currency: inv.currency || 'MYR',
      amountMyr: parseFloat((inv.amountMyr !== null && inv.amountMyr !== undefined ? inv.amountMyr : inv.amount || 0).toString()),
    }));

    // Calculate outstanding
    const outstanding = poReceived - invoiced;

    // Calculate vendor POs issued (for this project AND all its VOs)
    const projectIssuedPOs = issuedPOs.filter(
      (po) => projectCodes.includes(po.projectCode)
    );

    const vendorPOsIssued = projectIssuedPOs.reduce((sum, po) => {
      // Issued POs store amount in MYR directly (no amountMyr field)
      return sum + parseFloat((po.amount || 0).toString());
    }, 0);

    const vendorPOsOriginal: OriginalCurrencyAmount[] = projectIssuedPOs.map((po) => ({
      amount: parseFloat(po.amount.toString()),
      currency: 'MYR',  // Issued POs are always in MYR
      amountMyr: parseFloat((po.amount || 0).toString()),
    }));

    // Calculate vendor invoices received (need to lookup via IssuedPO)
    const projectReceivedInvoices = receivedInvoices.filter((inv) => {
      const issuedPO = issuedPOs.find(po => po.id === inv.issuedPoId);
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Matching received invoice:', {
          invoiceNumber: inv.invoiceNumber,
          issuedPoId: inv.issuedPoId,
          foundPO: issuedPO ? { id: issuedPO.id, projectCode: issuedPO.projectCode } : null,
          projectCode: project.projectCode,
          matches: issuedPO?.projectCode === project.projectCode
        });
      }
      return issuedPO?.projectCode === project.projectCode;
    });

    // Calculate vendor invoices received (MYR) - fallback to amount if amountMyr is null/undefined
    const vendorInvoicesReceived = projectReceivedInvoices.reduce((sum, inv) => {
      const amount = inv.amountMyr !== null && inv.amountMyr !== undefined
        ? inv.amountMyr
        : inv.amount; // Fallback to original amount
      return sum + parseFloat((amount || 0).toString());
    }, 0);

    const vendorInvoicesOriginal: OriginalCurrencyAmount[] = projectReceivedInvoices.map((inv) => ({
      amount: parseFloat(inv.amount.toString()),
      currency: inv.currency || 'MYR',
      amountMyr: parseFloat((inv.amountMyr !== null && inv.amountMyr !== undefined ? inv.amountMyr : inv.amount || 0).toString()),
    }));

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
        // Match against userId (user.id) instead of team member id, since timesheets reference users table
        const engineer = teamMembers.find((tm) => tm.userId?.toString() === engineerIdStr);
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

    // Calculate total base cost
    const baseCost = engineerBreakdown.reduce((sum, eng) => sum + eng.totalCost, 0);

    return {
      projectId: project.id,
      projectCode: project.projectCode,
      projectTitle: project.title,
      clientName: project.companyName || 'Unknown Client',
      status: project.status,
      poReceived,
      invoiced,
      outstanding,
      poReceivedOriginal,
      invoicedOriginal,
      baseCost,
      actualHours,
      engineerBreakdown,
      vendorPOsIssued,
      vendorInvoicesReceived,
      vendorPOsOriginal,
      vendorInvoicesOriginal,
      isParentProject: !project.isVariationOrder && (project.variationOrders?.length || 0) > 0,
      voCount: project.variationOrders?.length || 0,
    };
  });
}

/**
 * Calculate aggregate totals for summary cards
 */
function calculateTotals(
  projectSummaries: ProjectFinanceSummary[],
  purchaseOrders: PurchaseOrderData[],
  invoices: InvoiceData[],
  issuedPOs: IssuedPOData[],
  receivedInvoices: ReceivedInvoiceData[]
): FinanceTotals {
  const totalPOReceived = projectSummaries.reduce((sum, p) => sum + p.poReceived, 0);
  const totalInvoiced = projectSummaries.reduce((sum, p) => sum + p.invoiced, 0);
  const totalOutstanding = totalPOReceived - totalInvoiced;
  const totalBaseCost = projectSummaries.reduce((sum, p) => sum + p.baseCost, 0);

  // Group PO amounts by currency (original amounts)
  const poReceivedByCurrency: Record<string, number> = {};
  purchaseOrders
    .filter((po) => po.isActive)
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

  // Calculate vendor totals
  const totalVendorPOsIssued = projectSummaries.reduce(
    (sum, p) => sum + p.vendorPOsIssued,
    0
  );
  const totalVendorInvoicesReceived = projectSummaries.reduce(
    (sum, p) => sum + p.vendorInvoicesReceived,
    0
  );

  // Group vendor PO amounts by currency
  const vendorPOsByCurrency: Record<string, number> = {};
  issuedPOs.forEach((po) => {
    const currency = po.currency || 'MYR';
    const amount = parseFloat(po.amount.toString());
    vendorPOsByCurrency[currency] = (vendorPOsByCurrency[currency] || 0) + amount;
  });

  // Group vendor invoice amounts by currency
  const vendorInvoicesByCurrency: Record<string, number> = {};
  receivedInvoices.forEach((inv) => {
    const currency = inv.currency || 'MYR';
    const amount = parseFloat(inv.amount.toString());
    vendorInvoicesByCurrency[currency] = (vendorInvoicesByCurrency[currency] || 0) + amount;
  });

  return {
    totalPOReceived,
    totalInvoiced,
    totalOutstanding,
    totalBaseCost,
    poReceivedByCurrency,
    invoicedByCurrency,
    totalVendorPOsIssued,
    totalVendorInvoicesReceived,
    vendorPOsByCurrency,
    vendorInvoicesByCurrency,
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
