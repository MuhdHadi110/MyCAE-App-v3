import { DollarSign, TrendingUp, Clock, Users, Settings } from 'lucide-react';
import type { ProjectFinance, ManHourBreakdown } from '../types/projectFinance.types';
import { getCurrentUser } from '../lib/auth';
import { getPermissions } from '../lib/permissions';

interface ProjectFinanceCardProps {
  project: ProjectFinance;
  manHourBreakdown?: ManHourBreakdown[];
  onManageRates?: () => void;
}

export const ProjectFinanceCard: React.FC<ProjectFinanceCardProps> = ({ project, manHourBreakdown, onManageRates }) => {
  const currentUser = getCurrentUser();
  const permissions = getPermissions(currentUser.role as any);
  const canViewManHours = permissions.canViewManHourCost;
  const isManagerOrAbove = permissions.canViewAnalytics;
  const canManageRates = isManagerOrAbove && onManageRates;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      case 'pre-lim': return 'bg-blue-100 text-blue-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">{project.projectCode}</h3>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{project.projectTitle}</p>
          <p className="text-xs text-gray-500 mt-1">{project.clientName}</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-bold ${project.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            RM{project.grossProfit.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">{project.profitMargin}% Margin</p>
        </div>
      </div>

      {/* Basic Financial Summary - All Levels */}
      <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
          <p className="text-lg font-semibold text-gray-900">RM{project.totalRevenue.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Total Cost</p>
          <p className="text-lg font-semibold text-gray-900">RM{project.totalCost.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Hours</p>
          <p className="text-lg font-semibold text-gray-900">{project.actualHours}h</p>
        </div>
      </div>

      {/* Manager+ View: Detailed Breakdown */}
      {isManagerOrAbove && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenue Breakdown
            </h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500">PO Received</p>
                <p className="font-semibold text-gray-900">RM{project.receivedPOs.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Invoiced</p>
                <p className="font-semibold text-gray-900">RM{project.invoiced.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-500">Paid</p>
                <p className="font-semibold text-green-600">RM{project.paid.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Cost Breakdown
            </h4>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Man-Hours</p>
                <p className="font-semibold text-gray-900">RM{project.manHourCost.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Budget vs Actual
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Budgeted Hours</p>
                <p className="font-semibold text-gray-900">{project.budgetedHours}h</p>
              </div>
              <div>
                <p className="text-gray-500">Actual Hours</p>
                <p className={`font-semibold ${project.actualHours > project.budgetedHours ? 'text-red-600' : 'text-green-600'}`}>
                  {project.actualHours}h
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Principal Engineer+ View: Man-Hour Analysis */}
      {canViewManHours && manHourBreakdown && manHourBreakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Man-Hour Cost Analysis
            </h4>
            {canManageRates && (
              <button
                onClick={onManageRates}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors border border-primary-200"
              >
                <Settings className="w-3.5 h-3.5" />
                Manage Rates
              </button>
            )}
          </div>
          <div className="space-y-2">
            {manHourBreakdown.map((member, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                <div>
                  <p className="font-medium text-gray-900">{member.engineerName}</p>
                  <p className="text-xs text-gray-500">{member.role} • {member.hoursLogged}h @ RM{member.hourlyRate}/h</p>
                </div>
                <p className="font-semibold text-gray-900">RM{member.totalCost.toLocaleString()}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
            <span className="font-medium text-gray-700">Average Rate</span>
            <span className="font-semibold text-gray-900">RM{project.averageHourlyRate}/h</span>
          </div>
        </div>
      )}
    </div>
  );
};
