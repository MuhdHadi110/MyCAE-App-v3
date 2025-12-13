import React, { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, FileText, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { getCurrentUser } from '../lib/auth';
import { checkPermission, getPermissionMessage, getRoleInfo } from '../lib/permissions';
import { useNavigate } from 'react-router-dom';

export const FinanceOverviewScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const canAccess = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canAccessFinance');
  const canUpload = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canUploadPO');
  const canApprove = currentUser && checkPermission((currentUser.role || 'engineer') as any, 'canApproveInvoices');
  const roleInfo = getRoleInfo(currentUser.role as any);

  // Filter state
  const [filterType, setFilterType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

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
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${roleInfo.color} mb-6`}>
            <span>{roleInfo.icon}</span>
            <div className="text-left">
              <p className="text-sm font-semibold">{roleInfo.label}</p>
              <p className="text-xs opacity-75">Level {roleInfo.level} Access</p>
            </div>
          </div>
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

  // All transactions from backend (when available)
  const allTransactions = [];

  // Filter transactions based on selected period
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const transactionYear = transactionDate.getFullYear();
      const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');

      if (filterType === 'monthly') {
        const [year, month] = selectedMonth.split('-');
        return transactionYear === parseInt(year) && transactionMonth === month;
      } else {
        return transactionYear === selectedYear;
      }
    });
  }, [filterType, selectedMonth, selectedYear]);

  // Calculate financial stats based on filtered transactions
  const financialStats = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netProfit = income - expenses;
    const margin = income > 0 ? (netProfit / income) * 100 : 0;

    // Growth calculation (compare to previous period)
    let previousIncome = 0, previousExpenses = 0;

    if (filterType === 'monthly') {
      const [year, month] = selectedMonth.split('-');
      const prevMonth = month === '01' ? '12' : String(parseInt(month) - 1).padStart(2, '0');
      const prevYear = month === '01' ? parseInt(year) - 1 : parseInt(year);
      const prevMonthStr = `${prevYear}-${prevMonth}`;

      previousIncome = allTransactions
        .filter(t => t.type === 'income' && t.date.startsWith(prevMonthStr))
        .reduce((sum, t) => sum + t.amount, 0);
      previousExpenses = allTransactions
        .filter(t => t.type === 'expense' && t.date.startsWith(prevMonthStr))
        .reduce((sum, t) => sum + t.amount, 0);
    } else {
      const prevYear = selectedYear - 1;
      previousIncome = allTransactions
        .filter(t => t.type === 'income' && t.date.startsWith(String(prevYear)))
        .reduce((sum, t) => sum + t.amount, 0);
      previousExpenses = allTransactions
        .filter(t => t.type === 'expense' && t.date.startsWith(String(prevYear)))
        .reduce((sum, t) => sum + t.amount, 0);
    }

    const revenueGrowth = previousIncome > 0 ? (((income - previousIncome) / previousIncome) * 100) : 0;
    const expenseGrowth = previousExpenses > 0 ? (((expenses - previousExpenses) / previousExpenses) * 100) : 0;

    return {
      totalRevenue: income,
      totalExpenses: expenses,
      netProfit: netProfit,
      profitMargin: Math.round(margin),
      monthlyRevenue: income,
      monthlyExpenses: expenses,
      monthlyProfit: netProfit,
      revenueGrowth: revenueGrowth.toFixed(1),
      expenseGrowth: expenseGrowth.toFixed(1),
    };
  }, [filteredTransactions, filterType, selectedMonth, selectedYear]);

  const recentTransactions = filteredTransactions;

  // TODO: Connect to backend API for upcoming payments
  const upcomingPayments: any[] = [];

  const formatCurrency = (amount: number) => {
    return `RM ${amount.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-MY', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {/* Top Row: Title and Buttons */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finance Overview</h1>
              <p className="text-gray-600 mt-1">Financial performance and key metrics</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/finance/documents')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
              >
                <FileText className="w-5 h-5" />
                Finance Documents
              </button>
              <button className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium shadow-sm">
                <Calendar className="w-5 h-5" />
                Export Report
              </button>
            </div>
          </div>

          {/* Bottom Row: Period Filter (aligned right) */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-end">
            <span className="text-sm font-medium text-gray-600">View by:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('monthly')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'monthly'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setFilterType('yearly')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === 'yearly'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yearly
              </button>
            </div>

            {/* Period Selector */}
            {filterType === 'monthly' ? (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            ) : (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Key Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-600">
                +{financialStats.revenueGrowth}%
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-2">Total Revenue</div>
            <div className="text-3xl font-bold text-gray-900 whitespace-nowrap">
              {formatCurrency(financialStats.totalRevenue)}
            </div>
            <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">
              This month: {formatCurrency(financialStats.monthlyRevenue)}
            </div>
          </div>

          {/* Total Expenses */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm font-medium text-red-600">
                +{financialStats.expenseGrowth}%
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-2">Total Expenses</div>
            <div className="text-3xl font-bold text-gray-900 whitespace-nowrap">
              {formatCurrency(financialStats.totalExpenses)}
            </div>
            <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">
              This month: {formatCurrency(financialStats.monthlyExpenses)}
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary-600" />
              </div>
              <span className="text-sm font-medium text-primary-600">
                {financialStats.profitMargin}% Margin
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-2">Net Profit</div>
            <div className="text-3xl font-bold text-gray-900 whitespace-nowrap">
              {formatCurrency(financialStats.netProfit)}
            </div>
            <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">
              This month: {formatCurrency(financialStats.monthlyProfit)}
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-orange-600">
                {upcomingPayments.length} Due
              </span>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-2">Upcoming Payments</div>
            <div className="text-3xl font-bold text-gray-900 whitespace-nowrap">
              {formatCurrency(upcomingPayments.reduce((sum, p) => sum + p.amount, 0))}
            </div>
            <div className="text-xs text-gray-500 mt-2 whitespace-nowrap">
              {upcomingPayments.length > 0 ? `Next: ${formatDate(upcomingPayments[0].dueDate)}` : 'No upcoming payments'}
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentTransactions.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No recent transactions</p>
                </div>
              ) : (
                recentTransactions.map((transaction) => (
                <div key={transaction.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">{formatDate(transaction.date)}</span>
                        {transaction.status === 'pending' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <div className={`text-lg font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View All Transactions →
              </button>
            </div>
          </div>

          {/* Upcoming Payments */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Payments</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {upcomingPayments.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">No upcoming payments</p>
                </div>
              ) : (
                upcomingPayments.map((payment) => (
                  <div key={payment.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">Due: {formatDate(payment.dueDate)}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            payment.priority === 'high'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {payment.priority === 'high' ? 'High Priority' : 'Medium'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {payment.description}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                Manage Payments →
              </button>
            </div>
          </div>
        </div>

        {/* Permission Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Your Finance Permissions:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  {canAccess ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={canAccess ? 'text-green-700' : 'text-gray-500'}>
                    View Financial Reports
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {canUpload ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={canUpload ? 'text-green-700' : 'text-gray-500'}>
                    Create Purchase Orders
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {canApprove ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={canApprove ? 'text-green-700' : 'text-gray-500'}>
                    Approve/Reject POs
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};