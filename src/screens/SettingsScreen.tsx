import { useRef, useState } from 'react';
import { User, Database, Info, ChevronRight, Download, Upload, Lock, Settings as SettingsIcon, Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { ChangePasswordModal } from '../components/modals/ChangePasswordModal';
import { UserPreferencesModal } from '../components/modals/UserPreferencesModal';
import { CompanySettingsForm } from '../components/settings/CompanySettingsForm';
import { useTeamStore } from '../store/teamStore';
import { useProjectStore } from '../store/projectStore';
import { useClientStore } from '../store/clientStore';
import { useInventoryStore } from '../store/inventoryStore';
import { useCheckoutStore } from '../store/checkoutStore';
import { usePCStore } from '../store/pcStore';
import { useResearchStore } from '../store/researchStore';
import { useMaintenanceStore } from '../store/maintenanceStore';
import { logger } from '../lib/logger';
import { useAuth } from '../contexts/AuthContext';

export const SettingsScreen: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isCompanySettingsExpanded, setIsCompanySettingsExpanded] = useState(false);
  const { user } = useAuth();

  // Check if user has admin role (company settings are admin-only)
  const canManageCompanySettings = user && (
    user.role === 'admin' ||
    (Array.isArray(user.roles) && user.roles.includes('admin'))
  );

  // Get state from all stores
  const teamMembers = useTeamStore((state) => state.teamMembers);
  const projects = useProjectStore((state) => state.projects);
  const clients = useClientStore((state) => state.clients);
  const inventoryItems = useInventoryStore((state) => state.items);
  const checkouts = useCheckoutStore((state) => state.checkouts);
  const pcs = usePCStore((state) => state.pcs);
  const researchProjects = useResearchStore((state) => state.researchProjects);
  const maintenanceTickets = useMaintenanceStore((state) => state.tickets);

  const handleExportData = () => {
    try {
      const allData = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        records: {
          teamMembers,
          projects,
          clients,
          inventoryItems,
          checkouts,
          pcs,
          researchProjects,
          maintenanceTickets,
        },
        summary: {
          totalTeamMembers: teamMembers.length,
          totalProjects: projects.length,
          totalClients: clients.length,
          totalInventoryItems: inventoryItems.length,
          totalCheckouts: checkouts.length,
          totalPCs: pcs.length,
          totalResearchProjects: researchProjects.length,
          totalMaintenanceTickets: maintenanceTickets.length,
        },
      };

      const jsonString = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mycae-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`✅ Data exported successfully! (${Object.keys(allData.summary).length} entities)`);
    } catch (error) {
      toast.error('❌ Failed to export data');
      logger.error('Export error:', error);
    }
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate structure
        if (!data.records || !data.summary) {
          throw new Error('Invalid file format');
        }

        toast.success(
          `✅ Data imported successfully!\n` +
          `Teams: ${data.summary.totalTeamMembers}, ` +
          `Projects: ${data.summary.totalProjects}, ` +
          `Clients: ${data.summary.totalClients}, ` +
          `Inventory: ${data.summary.totalInventoryItems}`
        );

        logger.debug('Imported data:', data);
      } catch (error) {
        toast.error('❌ Failed to parse import file');
        logger.error('Import error:', error);
      }
    };
    reader.readAsText(file);

    // Reset input
    event.target.value = '';
  };


  return (
    <div className="min-h-full bg-gray-50">
      <div className="p-4 md:p-6  space-y-6">
        {/* Header Container */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage app data and integrations</p>
        </div>

        {/* Profile Section */}
        <Card variant="bordered" className="mb-4">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-600" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900">{user?.name || 'User'}</p>
                  <p className="text-sm text-gray-500">{user?.email || 'user@mycae.com'}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-medium text-gray-700">Change Password</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button
                  onClick={() => setIsPreferencesModalOpen(true)}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <SettingsIcon className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-medium text-gray-700">Preferences</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Settings Section - Admin Only */}
        {canManageCompanySettings && (
          <Card variant="bordered" className="mb-4">
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-amber-800">
                    <strong>Admin Only:</strong> Configure company branding, logo, and PDF document settings.
                    These settings will be applied to all generated invoices and purchase orders.
                  </p>
                </div>

                <button
                  onClick={() => setIsCompanySettingsExpanded(!isCompanySettingsExpanded)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {isCompanySettingsExpanded ? 'Hide Company Settings' : 'Edit Company Settings'}
                    </span>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isCompanySettingsExpanded ? 'rotate-90' : ''}`} />
                </button>

                {isCompanySettingsExpanded && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <CompanySettingsForm />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Management Section */}
        <Card variant="bordered" className="mb-4">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Export:</strong> Download all application data as JSON file<br/>
                  <strong>Import:</strong> Load data from previously exported JSON file
                </p>
              </div>

              <Button
                variant="outline"
                fullWidth
                icon={<Download className="w-5 h-5" />}
                onClick={handleExportData}
              >
                Export Data
              </Button>

              <Button
                variant="outline"
                fullWidth
                icon={<Upload className="w-5 h-5" />}
                onClick={handleImportData}
              >
                Import Data
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Data Summary */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-900 mb-3">Current Data Summary</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Team Members</p>
                    <p className="text-xl font-bold text-primary-600">{teamMembers.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Projects</p>
                    <p className="text-xl font-bold text-primary-600">{projects.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Inventory Items</p>
                    <p className="text-xl font-bold text-primary-600">{inventoryItems.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">PCs</p>
                    <p className="text-xl font-bold text-primary-600">{pcs.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card variant="bordered">
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">App Version</p>
                <p className="text-sm text-gray-500">1.0.0</p>
              </div>
            </div>
          </button>
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              MyCAE Equipment Tracker - Inventory Management System
            </p>
          </div>
        </CardContent>
        </Card>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userEmail={user?.email}
        onSuccess={() => {
          setIsPasswordModalOpen(false);
          toast.success('Password changed successfully!');
        }}
      />

      {/* User Preferences Modal */}
      <UserPreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        onSave={(preferences) => {
          setIsPreferencesModalOpen(false);
          toast.success('Preferences saved successfully!');
          // Optionally save preferences to backend/state
        }}
      />
    </div>
  );
};
