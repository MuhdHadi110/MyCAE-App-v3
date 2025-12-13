import React from 'react';
import { SOFTWARE_CATALOG, Software } from '../types/software.types';

interface SoftwareSelectionProps {
  selectedSoftware: string[];
  onSelectionChange: (selected: string[]) => void;
}

export const SoftwareSelection: React.FC<SoftwareSelectionProps> = ({ selectedSoftware, onSelectionChange }) => {

  const handleCheckboxChange = (softwareName: string) => {
    const newSelection = selectedSoftware.includes(softwareName)
      ? selectedSoftware.filter(s => s !== softwareName)
      : [...selectedSoftware, softwareName];
    onSelectionChange(newSelection);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">Software Used</label>
      <div className="space-y-4">
        {SOFTWARE_CATALOG.map(category => (
          <div key={category.name}>
            <h4 className="font-semibold text-gray-800">{category.name}</h4>
            <div className="pl-4 mt-2 space-y-2">
              {category.licenses.map(license => {
                const softwareId = `${category.name} - ${license.name}`;
                return (
                  <div key={softwareId} className="flex items-center">
                    <input
                      type="checkbox"
                      id={softwareId}
                      checked={selectedSoftware.includes(softwareId)}
                      onChange={() => handleCheckboxChange(softwareId)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={softwareId} className="ml-3 text-sm text-gray-600">
                      {license.name} ({license.count} license{license.count > 1 ? 's' : ''})
                      {license.lockedTo && <span className="text-xs text-red-500 ml-2">(Locked to {license.lockedTo})</span>}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
