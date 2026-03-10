import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCompanyStore } from '../../store/companyStore';
import { Company, CompanyType } from '../../types/company.types';

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
}

export const EditCompanyModal: React.FC<EditCompanyModalProps> = ({ isOpen, onClose, company }) => {
  const { updateCompany } = useCompanyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_type: [] as CompanyType[],
    industry: '',
    website: '',
    address: '',
  });

  const companyTypes: CompanyType[] = ['client', 'vendor', 'customer', 'supplier'];

  // Load company data when modal opens
  useEffect(() => {
    if (company && isOpen) {
      setFormData({
        name: company.name || '',
        company_type: company.company_type || [],
        industry: company.industry || '',
        website: company.website || '',
        address: company.address || '',
      });
    }
  }, [company, isOpen]);

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

    if (!formData.name.trim() || !company) {
      return;
    }

    setIsLoading(true);
    await updateCompany(company.id, formData);
    setIsLoading(false);
    handleClose();
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

  if (!company) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Edit Company" icon={<Building2 className="w-5 h-5 text-primary-600" />} size="md">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-company-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="edit-company-name"
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
            <label htmlFor="edit-industry" className="block text-sm font-medium text-gray-700 mb-1.5">
              Industry
            </label>
            <Input
              id="edit-industry"
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              placeholder="e.g., Manufacturing, Technology, Healthcare"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="edit-website" className="block text-sm font-medium text-gray-700 mb-1.5">
              Website
            </label>
            <Input
              id="edit-website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.example.com"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1.5">
              Address
            </label>
            <textarea
              id="edit-address"
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
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
