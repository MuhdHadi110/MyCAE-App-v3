/**
 * Project Finance Analytics Types
 */

export interface ProjectFinance {
  projectId: string;
  projectCode: string;
  projectTitle: string;
  clientName: string;
  status: 'open' | 'closed' | 'pre-lim' | 'on-hold' | 'ongoing' | 'completed';

  // Revenue
  totalRevenue: number;
  receivedPOs: number;
  invoiced: number;
  paid: number;

  // Costs
  equipmentCost: number;
  softwareCost: number;
  manHourCost: number;
  overheadCost: number;
  totalCost: number;

  // Profit
  grossProfit: number;
  profitMargin: number;

  // Man-Hours (Principal Engineer+ only)
  budgetedHours: number;
  actualHours: number;
  averageHourlyRate: number;

  // Timeline
  startDate: string;
  endDate?: string;
}

export interface ManHourBreakdown {
  engineerId: string;
  engineerName: string;
  role: string;
  hoursLogged: number;
  hourlyRate: number;
  totalCost: number;
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}
