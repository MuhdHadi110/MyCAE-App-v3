import { useEffect, useState, useCallback } from 'react';
import { Building2, UserPlus, Plus, Mail, Phone, Briefcase, Trash2 } from 'lucide-react';
import { useCompanyStore } from '../store/companyStore';
import { Button } from '../components/ui/Button';
import { AddCompanyModal } from '../components/modals/AddCompanyModal';
import { AddContactModal } from '../components/modals/AddContactModal';
import { CompanyWithContacts } from '../types/company.types';

export const CompaniesScreen: React.FC = () => {
  const { companies, fetchCompanies, deleteCompany, deleteContact } = useCompanyStore();
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyWithContacts | null>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseAddCompanyModal = useCallback(() => {
    setIsAddCompanyModalOpen(false);
  }, []);

  const handleCloseAddContactModal = useCallback(() => {
    setIsAddContactModalOpen(false);
    setSelectedCompany(null);
  }, []);

  const handleAddContact = (company: CompanyWithContacts) => {
    setSelectedCompany(company);
    setIsAddContactModalOpen(true);
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (window.confirm(`Are you sure you want to delete "${companyName}"? This will also delete all associated contacts.`)) {
      await deleteCompany(companyId);
    }
  };

  const handleDeleteContact = async (contactId: string, contactName: string) => {
    if (window.confirm(`Are you sure you want to delete "${contactName}"?`)) {
      await deleteContact(contactId);
    }
  };

  const toggleCompany = (companyId: string) => {
    setExpandedCompanyId(expandedCompanyId === companyId ? null : companyId);
  };

  const filteredCompanies = companies.filter((company) => {
    const query = searchQuery.toLowerCase();
    const companyMatch = company.name.toLowerCase().includes(query);
    const contactMatch = company.contacts.some(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query)
    );
    return companyMatch || contactMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary-600" />
                Companies & Contacts
              </h1>
              <p className="text-gray-600 mt-2">
                Manage your business contacts and company information
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setIsAddCompanyModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Company
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search companies or contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Companies List */}
        {filteredCompanies.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No companies found' : 'No companies yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by adding your first company'}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                onClick={() => setIsAddCompanyModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add First Company
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCompanies.map((company) => (
              <div key={company.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Company Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleCompany(company.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-primary-600" />
                        <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                          {company.contacts.length} {company.contacts.length === 1 ? 'contact' : 'contacts'}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-600 ml-8">
                        {company.industry && (
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4" />
                            {company.industry}
                          </span>
                        )}
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {company.website}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddContact(company);
                        }}
                        icon={<UserPlus className="w-4 h-4" />}
                      >
                        Add Contact
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCompany(company.id, company.name);
                        }}
                        icon={<Trash2 className="w-4 h-4" />}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Contacts List */}
                {expandedCompanyId === company.id && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {company.contacts.length === 0 ? (
                      <div className="p-8 text-center">
                        <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 mb-4">No contacts yet for this company</p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleAddContact(company)}
                          icon={<Plus className="w-4 h-4" />}
                        >
                          Add First Contact
                        </Button>
                      </div>
                    ) : (
                      <div className="p-6 space-y-3">
                        {company.contacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="bg-white rounded-xl p-4 hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                                  {contact.position && (
                                    <span className="text-sm text-gray-600">• {contact.position}</span>
                                  )}
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4" />
                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="text-primary-600 hover:underline"
                                    >
                                      {contact.email}
                                    </a>
                                  </div>
                                  {contact.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4" />
                                      <a
                                        href={`tel:${contact.phone}`}
                                        className="text-primary-600 hover:underline"
                                      >
                                        {contact.phone}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteContact(contact.id, contact.name)}
                                icon={<Trash2 className="w-4 h-4" />}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCompanyModal
        isOpen={isAddCompanyModalOpen}
        onClose={handleCloseAddCompanyModal}
      />
      {selectedCompany && (
        <AddContactModal
          isOpen={isAddContactModalOpen}
          onClose={handleCloseAddContactModal}
          companyId={selectedCompany.id}
          companyName={selectedCompany.name}
        />
      )}
    </div>
  );
};
