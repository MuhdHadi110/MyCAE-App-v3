import { TrendingUp, TrendingDown } from 'lucide-react';
import type { RevenueDataPoint } from '../../types/projectFinance.types';

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
  const maxValue = Math.max(...data.flatMap(d => [d.revenue, d.cost, d.profit]));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Revenue vs Cost Trend</h3>
        <p className="text-sm text-gray-500 mt-1">Monthly comparison</p>
      </div>

      <div className="space-y-4">
        {data.map((point, idx) => {
          const revenueWidth = (point.revenue / maxValue) * 100;
          const costWidth = (point.cost / maxValue) * 100;
          const profitWidth = (point.profit / maxValue) * 100;

          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{point.month}</span>
                <span className={`text-sm font-semibold flex items-center gap-1 ${point.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {point.profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  ${point.profit.toLocaleString()}
                </span>
              </div>

              <div className="space-y-1">
                <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="absolute h-full bg-green-500 transition-all"
                    style={{ width: `${revenueWidth}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                    Revenue: ${point.revenue.toLocaleString()}
                  </span>
                </div>

                <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="absolute h-full bg-red-500 transition-all"
                    style={{ width: `${costWidth}%` }}
                  />
                  <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                    Cost: ${point.cost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-gray-600">Cost</span>
        </div>
      </div>
    </div>
  );
};
