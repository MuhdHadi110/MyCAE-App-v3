import React, { useState, useEffect } from 'react';
import { AlertCircle, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import { getPermissionMessage } from '../lib/permissions';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useFinanceData } from '../hooks/useFinanceData';
import { FinanceSummaryCards } from '../components/finance/FinanceSummaryCards';
import { ProjectFinanceTable } from '../components/finance/ProjectFinanceTable';

// Generate year options (All Time + current year and 5 years back)
const currentYear = new Date().getFullYear();
const yearOptions = [0, ...Array.from({ length: 6 }, (_, i) => currentYear - i)];

// Month options
const monthOptions = [
  { value: 0, label: 'All Months' },
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const FinanceOverviewScreen: React.FC = () => {
  const navigate = useNavigate();
  const { canAccessFinance: canAccess, roleInfo } = usePermissions();

  // Date filter state - default to All Time (0)
  const [selectedYear, setSelectedYear] = useState<number>(0); // 0 = All Time
  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = All months

  // Finance data hook with date filters
  const { projectSummaries, totals, loading, error, refetch } = useFinanceData(selectedYear, selectedMonth);

  // Currency toggle state
  const [showOriginalCurrency, setShowOriginalCurrency] = useState(false);

  // Refetch data when screen becomes visible (e.g., when navigating back from Finance Documents)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refetch();
      }
    };

    const handleFocus = () => {
      refetch();
    };

    // Listen for visibility changes and window focus
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refetch]);

  // Access check
  if (!canAccess) {
    return (
      <div className="min-h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-4">
            {getPermissionMessage('access finance', 'senior-engineer')}
          </p>
          {roleInfo && (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${roleInfo.color} mb-6`}>
              <span>{roleInfo.icon}</span>
              <div className="text-left">
                <p className="text-sm font-semibold">{roleInfo.label}</p>
                <p className="text-xs opacity-75">Level {roleInfo.level} Access</p>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-full bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => refetch()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6 space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Top Row: Title and Buttons */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finance Overview</h1>
              <p className="text-gray-600 mt-1">PO received, invoiced amounts, and labor costs</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Date Filters */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-200">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none cursor-pointer"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year === 0 ? 'All Time' : year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency Toggle */}
              <button
                onClick={() => setShowOriginalCurrency(!showOriginalCurrency)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors ${
                  showOriginalCurrency
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                title={showOriginalCurrency ? 'Showing original currencies' : 'Showing MYR'}
              >
                {showOriginalCurrency ? (
                  <ToggleRight className="w-5 h-5" />
                ) : (
                  <ToggleLeft className="w-5 h-5" />
                )}
                {showOriginalCurrency ? 'Original' : 'MYR'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <FinanceSummaryCards
          totals={totals}
          showOriginalCurrency={showOriginalCurrency}
          loading={loading}
        />

        {/* Project Breakdown Table */}
        <ProjectFinanceTable
          projects={projectSummaries}
          showOriginalCurrency={showOriginalCurrency}
          loading={loading}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
        />
      </div>
    </div>
  );
};

export default FinanceOverviewScreen;
