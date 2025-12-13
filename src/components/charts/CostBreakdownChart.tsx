import type { CostBreakdown } from '../../types/projectFinance.types';

interface CostBreakdownChartProps {
  data: CostBreakdown[];
}

const COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-primary-500',
];

export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Cost Breakdown</h3>
        <p className="text-sm text-gray-500 mt-1">Total: ${total.toLocaleString()}</p>
      </div>

      {/* Horizontal stacked bar */}
      <div className="mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {data.map((item, idx) => (
            <div
              key={idx}
              className={`${COLORS[idx % COLORS.length]} transition-all hover:opacity-80`}
              style={{ width: `${item.percentage}%` }}
              title={`${item.category}: $${item.amount.toLocaleString()} (${item.percentage}%)`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 ${COLORS[idx % COLORS.length]} rounded`} />
              <span className="text-sm font-medium text-gray-700">{item.category}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-semibold text-gray-900">
                ${item.amount.toLocaleString()}
              </span>
              <span className="text-sm text-gray-500 w-12 text-right">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
