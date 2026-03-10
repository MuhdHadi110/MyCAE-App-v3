import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCompanyStore } from '../../store/companyStore';
import { Contact } from '../../types/company.types';

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
  companyName: string;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  companyName,
}) => {
  const { updateContact } = useCompanyStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
  });

  // Load contact data when modal opens
  useEffect(() => {
    if (contact && isOpen) {
      setFormData({
        name: contact.name || '',
        email: contact.email || '',
        phone: contact.phone || '',
        position: contact.position || '',
      });
    }
  }, [contact, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !contact) {
      return;
    }

    setIsLoading(true);
    await updateContact(contact.id, formData);
    setIsLoading(false);
    handleClose();
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

  if (!contact) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Edit Contact - ${companyName}`} icon={<User className="w-5 h-5 text-primary-600" />} size="md">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-contact-name" className="block text-sm font-medium text-gray-700 mb-1.5">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="edit-contact-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter contact name"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@example.com"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone
            </label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+60 12-345 6789"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="edit-position" className="block text-sm font-medium text-gray-700 mb-1.5">
              Position
            </label>
            <Input
              id="edit-position"
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
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
