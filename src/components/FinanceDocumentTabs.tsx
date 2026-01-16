import { FileText, Receipt, ShoppingCart, FileInput } from 'lucide-react';

export type FinanceTab = 'received-pos' | 'invoices' | 'issued-pos' | 'received-invoices';

interface FinanceDocumentTabsProps {
  activeTab: FinanceTab;
  onTabChange: (tab: FinanceTab) => void;
  receivedPOCount?: number;
  invoiceCount?: number;
  issuedPOCount?: number;
  receivedInvoiceCount?: number;
}

export const FinanceDocumentTabs: React.FC<FinanceDocumentTabsProps> = ({
  activeTab,
  onTabChange,
  receivedPOCount = 0,
  invoiceCount = 0,
  issuedPOCount = 0,
  receivedInvoiceCount = 0,
}) => {
  const tabs = [
    {
      id: 'received-pos' as FinanceTab,
      label: 'Received POs',
      icon: FileText,
      count: receivedPOCount,
    },
    {
      id: 'invoices' as FinanceTab,
      label: 'Invoices',
      icon: Receipt,
      count: invoiceCount,
    },
    {
      id: 'issued-pos' as FinanceTab,
      label: 'Issued POs',
      icon: ShoppingCart,
      count: issuedPOCount,
    },
    {
      id: 'received-invoices' as FinanceTab,
      label: 'Received Invoices',
      icon: FileInput,
      count: receivedInvoiceCount,
    },
  ];

  return (
    <div className="flex justify-center py-6 bg-white">
      <div className="flex items-stretch gap-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                relative flex items-center gap-4 px-8 py-5 rounded-2xl min-w-[200px]
                transition-all duration-200 ease-out border-2
                ${
                  isActive
                    ? 'bg-white border-primary-500 shadow-lg shadow-primary-100/50'
                    : 'bg-gray-50 border-transparent hover:bg-white hover:border-gray-200 hover:shadow-md'
                }
              `}
            >
              <div
                className={`
                  p-3 rounded-xl transition-colors
                  ${isActive ? 'bg-primary-100' : 'bg-gray-100'}
                `}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
              </div>
              <div className="flex flex-col items-start">
                <span className={`font-semibold text-base ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                  {tab.label}
                </span>
                <span className={`text-sm ${isActive ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                  {tab.count} {tab.count === 1 ? 'document' : 'documents'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
