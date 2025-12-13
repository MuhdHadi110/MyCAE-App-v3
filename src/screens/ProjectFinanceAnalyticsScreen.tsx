import { useState, useMemo, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, DollarSign, Filter, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ProjectFinanceCard } from '../components/ProjectFinanceCard';
import { ManageProjectHourlyRatesModal } from '../components/modals/ManageProjectHourlyRatesModal';
import { RevenueChart } from '../components/charts/RevenueChart';
import { CostBreakdownChart } from '../components/charts/CostBreakdownChart';
import apiService from '../services/api.service';
import type { ProjectFinance, ManHourBreakdown, RevenueDataPoint, CostBreakdown } from '../types/projectFinance.types';
import { getCurrentUser } from '../lib/auth';
import { checkPermission } from '../lib/permissions';
import { useProjectStore } from '../store/projectStore';
import { useTeamStore } from '../store/teamStore';

export const ProjectFinanceAnalyticsScreen = () => {
  const currentUser = getCurrentUser();
  const canAccessFinance = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canAccessFinance');

  const { projects, timesheets, fetchProjects, fetchTimesheets } = useProjectStore();
  const { teamMembers, fetchTeamMembers } = useTeamStore();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'profit' | 'revenue' | 'cost'>('profit');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectRates, setProjectRates] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    fetchProjects();
    fetchTimesheets();
    fetchTeamMembers();

    // Load project-specific hourly rates
    const loadProjectRates = async () => {
      try {
        const allRates: Record<string, Record<string, number>> = {};
        for (const project of projects) {
          try {
            const rates = await apiService.getProjectHourlyRates(project.id);
            allRates[project.id] = {};
            rates.forEach((rate: any) => {
              allRates[project.id][rate.teamMemberId] = parseFloat(rate.hourlyRate);
            });
          } catch (error) {
            // If rates don't exist for this project, continue with default rates
            console.debug(`No custom rates for project ${project.id}`);
          }
        }
        setProjectRates(allRates);
      } catch (error) {
        console.error('Failed to load project rates:', error);
      }
    };

    if (projects.length > 0) {
      loadProjectRates();
    }
  }, [fetchProjects, fetchTimesheets, fetchTeamMembers, projects.length]);

  // Calculate project finances from real data
  const projectFinances: ProjectFinance[] = useMemo(() => {
    const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];
    return projects.map((project) => {
      // Get timesheets for this project
      const projectTimesheets = safeTimesheets.filter(ts => ts.projectId.toString() === project.id);
      const actualHours = projectTimesheets.reduce((sum, ts) => sum + parseFloat(ts.hours.toString() || '0'), 0);

      // Calculate man-hour cost from timesheets
      let manHourCost = 0;
      projectTimesheets.forEach(ts => {
        const engineer = teamMembers.find(tm => tm.id === ts.engineerId.toString());
        // Use project-specific rate if available, otherwise use team member's rate, fallback to 75
        const projectRate = projectRates[project.id]?.[ts.engineerId.toString()];
        const rate = projectRate ?? engineer?.hourlyRate ?? 75;
        manHourCost += parseFloat(ts.hours.toString() || '0') * rate;
      });

      // Total cost is ONLY man-hour cost (based on actual timesheets)
      const totalCost = manHourCost;

      // PO/Revenue system not implemented yet - showing 0
      // TODO: Add PO tracking system
      const receivedPOs = 0;
      const totalRevenue = 0;
      const invoiced = 0;
      const paid = 0;

      const grossProfit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;

      const averageRate = actualHours > 0 ? manHourCost / actualHours : 0;

      return {
        projectId: project.id,
        projectCode: project.projectCode,
        projectTitle: project.title,
        clientName: project.clientName || 'Unknown Client',
        status: project.status,
        totalRevenue,
        receivedPOs,
        invoiced,
        paid,
        equipmentCost: 0, // Not tracked - only man-hour costs
        softwareCost: 0, // Not tracked - only man-hour costs
        manHourCost,
        overheadCost: 0, // Not tracked - only man-hour costs
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
  }, [projects, timesheets, teamMembers, projectRates]);

  // Calculate man-hour breakdown per project
  const manHourBreakdowns: Record<string, ManHourBreakdown[]> = useMemo(() => {
    const breakdowns: Record<string, ManHourBreakdown[]> = {};
    const safeTimesheets = Array.isArray(timesheets) ? timesheets : [];

    projects.forEach((project) => {
      const projectTimesheets = safeTimesheets.filter(ts => ts.projectId.toString() === project.id);

      // Group by engineer
      const engineerHours: Record<string, { hours: number; engineer: any }> = {};

      projectTimesheets.forEach(ts => {
        const engineerIdStr = ts.engineerId.toString();
        if (!engineerHours[engineerIdStr]) {
          const engineer = teamMembers.find(tm => tm.id === engineerIdStr);
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
  }, [projects, timesheets, teamMembers, projectRates]);

  // Calculate aggregate cost breakdown - Only man-hours
  const costBreakdown: CostBreakdown[] = useMemo(() => {
    const totalManHours = projectFinances.reduce((acc, proj) => acc + proj.manHourCost, 0);

    if (totalManHours === 0) return [];

    // Only man-hour costs tracked
    return [
      { category: 'Man-Hours', amount: totalManHours, percentage: 100 },
    ];
  }, [projectFinances]);

  // Revenue trend data (would come from historical data when backend is ready)
  const mockRevenueData: RevenueDataPoint[] = useMemo(() => {
    return [];
  }, []);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projectFinances;

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

    // Sort
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'profit': return b.grossProfit - a.grossProfit;
        case 'revenue': return b.totalRevenue - a.totalRevenue;
        case 'cost': return b.totalCost - a.totalCost;
        default: return 0;
      }
    });
  }, [projectFinances, statusFilter, sortBy, searchQuery]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalRevenue = filteredProjects.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalCost = filteredProjects.reduce((sum, p) => sum + p.totalCost, 0);
    const totalProfit = filteredProjects.reduce((sum, p) => sum + p.grossProfit, 0);
    const avgMargin = filteredProjects.length > 0
      ? filteredProjects.reduce((sum, p) => sum + p.profitMargin, 0) / filteredProjects.length
      : 0;

    return { totalRevenue, totalCost, totalProfit, avgMargin };
  }, [filteredProjects]);

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-primary-600" />
                Project Financial Analytics
              </h1>
              <p className="text-gray-600 mt-1">
                {canAccessFinance ? 'Full financial visibility with man-hour costs' :
                 'Basic project cost visibility'}
              </p>
              <p className="text-sm text-primary-600 mt-1">
                ✓ Synced with Timesheets • Real-time calculations
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm">Total Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">RM{summary.totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Cost</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">RM{summary.totalCost.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Total Profit</span>
            </div>
            <p className="text-2xl font-bold text-green-600">RM{summary.totalProfit.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">Avg Margin</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.avgMargin.toFixed(1)}%</p>
          </div>
        </div>

        {/* Charts - Manager+ Only */}
        {canAccessFinance && costBreakdown.length > 0 && (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <RevenueChart data={mockRevenueData} />
            <CostBreakdownChart data={costBreakdown} />
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by project code, title, or client name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="pre-lim">Pre-Lim</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="profit">Profit</option>
                  <option value="revenue">Revenue</option>
                  <option value="cost">Cost</option>
                </select>
              </div>
              {(statusFilter !== 'all' || searchQuery) && (
                <div className="ml-auto text-sm text-gray-600">
                  Showing {filteredProjects.length} of {projectFinances.length} projects
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Project Cards */}
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <ProjectFinanceCard
              key={project.projectId}
              project={project}
              manHourBreakdown={canAccessFinance ? manHourBreakdowns[project.projectId] : undefined}
              onManageRates={() => {
                setSelectedProjectId(project.projectId);
                setShowRatesModal(true);
              }}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No projects match your filters</p>
          </div>
        )}
      </div>

      {/* Manage Hourly Rates Modal */}
      {selectedProjectId && (
        <ManageProjectHourlyRatesModal
          isOpen={showRatesModal}
          onClose={() => {
            setShowRatesModal(false);
            setSelectedProjectId(null);
          }}
          projectCode={filteredProjects.find(p => p.projectId === selectedProjectId)?.projectCode || ''}
          projectTitle={filteredProjects.find(p => p.projectId === selectedProjectId)?.projectTitle || ''}
          manHourBreakdown={manHourBreakdowns[selectedProjectId] || []}
          onSave={async (rates) => {
            try {
              await apiService.saveProjectHourlyRates(selectedProjectId, rates);
              toast.success('Hourly rates saved successfully!');
              setShowRatesModal(false);
              setSelectedProjectId(null);
              // Refresh the project data to reflect updated calculations
              await fetchProjects();
              await fetchTimesheets();
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to save hourly rates';
              console.error('Error saving hourly rates:', error);
              toast.error(errorMessage);
            }
          }}
        />
      )}
    </div>
  );
};