import { useState, useEffect } from 'react';
import { X, Building2, User, Mail, Phone, MapPin, Tag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Client, ClientCategory } from '../../types/client.types';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (clientData: Omit<Client, 'id' | 'createdDate' | 'lastUpdated'>) => void;
  client?: Client | null;
}

const defaultFormData = {
  name: '',
  industry: '',
  categories: ['client'] as ClientCategory[],
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  activeProjects: 0,
  totalProjects: 0,
};

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onSubmit, client }) => {
  const [formData, setFormData] = useState(defaultFormData);

  const categoryOptions: ClientCategory[] = ['client', 'customer', 'vendor', 'supplier'];

  // Initialize form data when modal opens or client prop changes
  useEffect(() => {
    if (isOpen) {
      if (client) {
        // Edit mode: populate with existing client data
        setFormData({
          name: client.name || '',
          industry: client.industry || '',
          categories: client.categories || ['client'],
          contactPerson: client.contactPerson || '',
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
          website: client.website || '',
          activeProjects: client.activeProjects || 0,
          totalProjects: client.totalProjects || 0,
        });
      } else {
        // Add mode: reset to defaults
        setFormData(defaultFormData);
      }
    }
  }, [isOpen, client]);

  const handleCategoryToggle = (category: ClientCategory) => {
    setFormData(prev => {
      const newCategories = prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories: newCategories };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.contactPerson || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.categories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    

    // Call the onSubmit callback to save to database
    if (onSubmit) {
      onSubmit(formData);
    }

    setFormData(defaultFormData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <h2 className="text-2xl font-bold text-gray-900">
              {client ? 'Edit Business Contact' : 'Add Business Contact'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building2 className="w-4 h-4 inline mr-1" />
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Infineon Technologies"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    placeholder="e.g., Semiconductor Manufacturing"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Tag className="w-4 h-4 inline mr-1" />
                  Categories (Select one or more)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categoryOptions.map((category) => (
                    <label key={category} className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors" style={{
                      backgroundColor: formData.categories.includes(category) ? '#EEF2FF' : 'transparent',
                      borderColor: formData.categories.includes(category) ? '#6366F1' : '#D1D5DB'
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Contact Person <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    placeholder="e.g., John Smith"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@company.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+60 3-1234 5678"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://company.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter company address..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                {client ? 'Save Changes' : 'Add Contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
