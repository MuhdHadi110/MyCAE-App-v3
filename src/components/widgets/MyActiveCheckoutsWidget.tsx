import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, AlertCircle, CheckCircle, ArrowRight, Clock } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useCheckoutStore } from '../../store/checkoutStore';

export function MyActiveCheckoutsWidget() {
  const navigate = useNavigate();
  const { getMyActiveCheckouts, fetchCheckouts, stats } = useCheckoutStore();

  useEffect(() => {
    fetchCheckouts();
  }, []);

  const myCheckouts = getMyActiveCheckouts();
  const hasCheckouts = myCheckouts.length > 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      case 'partial-return':
        return <Badge variant="warning">Partial Return</Badge>;
      case 'active':
        return <Badge variant="success">Active</Badge>;
      default:
        return null;
    }
  };

  const getDaysUntilDue = (expectedReturnDate?: string) => {
    if (!expectedReturnDate) return null;

    const now = new Date();
    const dueDate = new Date(expectedReturnDate);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  return (
    <Card variant="bordered" padding="md">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">My Active Checkouts</h3>
        </div>
        {stats.myActive > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {stats.myActive}
          </span>
        )}
      </div>

      {/* Empty State */}
      {!hasCheckouts && (
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
          <p className="text-gray-600 text-sm mb-1">No active checkouts</p>
          <p className="text-gray-500 text-xs">All your items are checked in</p>
        </div>
      )}

      {/* Checkouts List */}
      {hasCheckouts && (
        <div className="space-y-3">
          {myCheckouts.slice(0, 3).map((checkout) => {
            const daysUntilDue = getDaysUntilDue(checkout.expectedReturnDate);
            const isOverdue = checkout.status === 'overdue';
            const isPartial = checkout.status === 'partial-return';

            return (
              <div
                key={checkout.id}
                className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}
                onClick={() => navigate('/checkouts')}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      {checkout.purpose || 'Untitled Checkout'}
                    </p>
                  </div>
                  {getStatusBadge(checkout.status)}
                </div>

                {/* Items Info */}
                <div className="flex items-center justify-between text-sm mb-2">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                      {isPartial ? (
                        <>
                          <span className="font-medium text-gray-900">
                            {checkout.remainingItems}/{checkout.totalItems}
                          </span>{' '}
                          items out
                        </>
                      ) : (
                        <>
                          <span className="font-medium text-gray-900">{checkout.totalItems}</span>{' '}
                          {checkout.totalItems === 1 ? 'item' : 'items'}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Due Date Info */}
                  {daysUntilDue !== null && (
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="w-3 h-3" />
                      {isOverdue ? (
                        <span className="text-red-600 font-medium">
                          {Math.abs(daysUntilDue)} days overdue
                        </span>
                      ) : daysUntilDue === 0 ? (
                        <span className="text-orange-600 font-medium">Due today</span>
                      ) : daysUntilDue === 1 ? (
                        <span className="text-gray-600">Due tomorrow</span>
                      ) : (
                        <span className="text-gray-600">Due in {daysUntilDue} days</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Checkout Date */}
                <div className="text-xs text-gray-500">
                  Checked out {new Date(checkout.checkedOutDate).toLocaleDateString()}
                </div>
              </div>
            );
          })}

          {/* Show More Link */}
          {myCheckouts.length > 3 && (
            <button
              onClick={() => navigate('/checkouts')}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
            >
              View all {myCheckouts.length} checkouts →
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      {hasCheckouts && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => navigate('/checkouts')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            View All Checkouts
          </Button>
        </div>
      )}

      {/* Overdue Warning */}
      {stats.overdue > 0 && (
        <div className="mt-4 pt-4 border-t border-red-200">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-medium text-red-900">
                {stats.overdue} {stats.overdue === 1 ? 'checkout is' : 'checkouts are'} overdue
              </p>
              <p className="text-red-700">Please return items as soon as possible</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
