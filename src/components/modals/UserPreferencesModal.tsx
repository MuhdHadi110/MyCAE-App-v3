import { useState, useEffect } from 'react';
import { X, Bell, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  lowStockAlerts: boolean;
  maintenanceReminders: boolean;
  darkMode: boolean;
  language: 'en' | 'ms';
  timeZone: string;
  twoFactorEnabled: boolean;
}

interface UserPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  emailNotifications: true,
  pushNotifications: true,
  lowStockAlerts: true,
  maintenanceReminders: true,
  darkMode: false,
  language: 'en',
  timeZone: 'Asia/Kuala_Lumpur',
  twoFactorEnabled: false,
};

export const UserPreferencesModal: React.FC<UserPreferencesModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
}) => {
  const { theme, toggleTheme } = useTheme();
  const [preferences, setPreferences] = useState<UserPreferences>({
    ...DEFAULT_PREFERENCES,
    darkMode: theme === 'dark',
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPreferences({
          ...parsed,
          darkMode: theme === 'dark',  // Always sync with theme context
        });
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    } else {
      setPreferences(prev => ({ ...prev, darkMode: theme === 'dark' }));
    }
  }, [isOpen, theme]);

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));

    // If darkMode is toggled, update theme immediately
    if (key === 'darkMode') {
      toggleTheme();
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Save to localStorage (in production, this would be an API call)
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      toast.success('Preferences saved successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-2xl p-6 bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Preferences</h2>
          <p className="text-sm text-gray-500 mt-1">{userEmail}</p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Notification Settings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Notifications</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) =>
                    handlePreferenceChange('emailNotifications', e.target.checked)
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Email Notifications</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={(e) =>
                    handlePreferenceChange('pushNotifications', e.target.checked)
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Push Notifications</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.lowStockAlerts}
                  onChange={(e) =>
                    handlePreferenceChange('lowStockAlerts', e.target.checked)
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Low Stock Alerts</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.maintenanceReminders}
                  onChange={(e) =>
                    handlePreferenceChange('maintenanceReminders', e.target.checked)
                  }
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Maintenance Reminders</span>
              </label>
            </div>
          </div>

          {/* Display Settings */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-gray-900">Display</h3>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.darkMode}
                  onChange={(e) => handlePreferenceChange('darkMode', e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Dark Mode</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={preferences.language}
                  onChange={(e) =>
                    handlePreferenceChange(
                      'language',
                      e.target.value as 'en' | 'ms'
                    )
                  }
                  className="w-full px-3 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="en">English</option>
                  <option value="ms">Malay (Bahasa Melayu)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Zone
                </label>
                <select
                  value={preferences.timeZone}
                  onChange={(e) => handlePreferenceChange('timeZone', e.target.value)}
                  className="w-full px-3 py-2 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="Asia/Kuala_Lumpur">Malaysia (GMT+8)</option>
                  <option value="Asia/Singapore">Singapore (GMT+8)</option>
                  <option value="Asia/Bangkok">Thailand (GMT+7)</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="America/New_York">New York (EST)</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-white bg-primary-600 rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
