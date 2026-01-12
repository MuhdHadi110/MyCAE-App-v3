import React from 'react';

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: string) => void;
  disabled?: boolean;
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  disabled,
  className
}) => {
  const currencies = [
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    // ASEAN Currencies
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
    { code: 'BND', name: 'Brunei Dollar', symbol: 'B$' },
    // Major Asian Currencies
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
    // Major Global Currencies
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={className || "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"}
    >
      {currencies.map((curr) => (
        <option key={curr.code} value={curr.code}>
          {curr.code} - {curr.name} ({curr.symbol})
        </option>
      ))}
    </select>
  );
};
