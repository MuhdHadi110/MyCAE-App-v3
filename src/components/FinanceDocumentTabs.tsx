import { FileText, Receipt, ShoppingCart } from 'lucide-react';

export type FinanceTab = 'received-pos' | 'invoices' | 'issued-pos';

interface FinanceDocumentTabsProps {
  activeTab: FinanceTab;
  onTabChange: (tab: FinanceTab) => void;
  receivedPOCount?: number;
  invoiceCount?: number;
  issuedPOCount?: number;
}

export const FinanceDocumentTabs: React.FC<FinanceDocumentTabsProps> = ({
  activeTab,
  onTabChange,
  receivedPOCount = 0,
  invoiceCount = 0,
  issuedPOCount = 0,
}) => {
  const tabs = [
    {
      id: 'received-pos' as FinanceTab,
      label: 'Received POs',
      sublabel: 'From Clients',
      icon: FileText,
      count: receivedPOCount,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      activeColor: 'bg-green-100 border-green-500 text-green-700',
    },
    {
      id: 'invoices' as FinanceTab,
      label: 'Invoices',
      sublabel: 'Outgoing',
      icon: Receipt,
      count: invoiceCount,
      color: 'text-primary-600',
      bgColor: 'bg-indigo-50',
      activeColor: 'bg-primary-100 border-primary-500 text-primary-700',
    },
    {
      id: 'issued-pos' as FinanceTab,
      label: 'Issued POs',
      sublabel: 'To Vendors',
      icon: ShoppingCart,
      count: issuedPOCount,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      activeColor: 'bg-orange-100 border-orange-500 text-orange-700',
    },
  ];

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex justify-center gap-3 px-4 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-3 px-6 py-5 border-b-2 transition-all whitespace-nowrap
                ${
                  isActive
                    ? `${tab.activeColor} font-semibold`
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              <div className={`p-2.5 rounded-lg ${isActive ? tab.bgColor : 'bg-gray-50'}`}>
                <Icon className={`w-6 h-6 ${isActive ? tab.color : 'text-gray-500'}`} />
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold">{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`px-2.5 py-1 text-sm font-bold rounded-full ${
                        isActive ? `${tab.bgColor} ${tab.color}` : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </div>
                <span className="text-base text-gray-500">{tab.sublabel}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
