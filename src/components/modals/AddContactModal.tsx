import { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCompanyStore } from '../../store/companyStore';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  companyId,
  companyName,
}) => {
  const { createContact } = useCompanyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      return;
    }

    setIsLoading(true);
    const contact = await createContact({
      company_id: companyId,
      ...formData,
    });
    setIsLoading(false);

    if (contact) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      position: '',
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Add Contact - ${companyName}`} icon={<UserPlus className="w-5 h-5 text-primary-600" />} size="md">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="contact-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter contact name"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone
            </label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+60 12-345 6789"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1.5">
              Position
            </label>
            <Input
              id="position"
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="e.g., CEO, Project Manager, Engineer"
              disabled={isLoading}
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
            {isLoading ? 'Adding...' : 'Add Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
