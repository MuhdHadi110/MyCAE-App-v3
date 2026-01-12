import { useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCompanyStore } from '../../store/companyStore';
import { CompanyType } from '../../types/company.types';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ isOpen, onClose }) => {
  const { createCompany } = useCompanyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_type: [] as CompanyType[],
    industry: '',
    website: '',
    address: '',
  });

  const companyTypes: CompanyType[] = ['client', 'vendor', 'customer', 'supplier'];

  const handleTypeToggle = (type: CompanyType) => {
    setFormData(prev => ({
      ...prev,
      company_type: prev.company_type.includes(type)
        ? prev.company_type.filter(t => t !== type)
        : [...prev.company_type, type]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    setIsLoading(true);
    const company = await createCompany(formData);
    setIsLoading(false);
    if (company) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      company_type: [],
      industry: '',
      website: '',
      address: '',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Company" icon={<Building2 className="w-5 h-5 text-primary-600" />} size="md">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="company-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter company name"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Company Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {companyTypes.map((type) => (
                <label
                  key={type}
                  className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={formData.company_type.includes(type)}
                    onChange={() => handleTypeToggle(type)}
                    disabled={isLoading}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1.5">
              Industry
            </label>
            <Input
              id="industry"
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g., Manufacturing, Technology, Healthcare"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1.5">
              Website
            </label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
              Address
            </label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter company address"
              rows={3}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading} className="flex-1">
            {isLoading ? 'Adding...' : 'Add Company'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
