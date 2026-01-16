import { useState } from 'react';
import { X, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import authService from '../../services/api.service';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isFirstTimeLogin?: boolean;
  userEmail?: string;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isFirstTimeLogin = false,
  userEmail = '',
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  // Password strength validation
  const validatePasswordStrength = (password: string) => {
    if (password.length < 8) {
      setPasswordStrength('weak');
      return;
    }
    if (
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^a-zA-Z0-9]/.test(password)
    ) {
      setPasswordStrength('strong');
    } else if (/[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('weak');
    }
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    validatePasswordStrength(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!isFirstTimeLogin && !currentPassword) {
      toast.error('Current password is required');
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (passwordStrength === 'weak') {
      toast.error(
        'Password must contain uppercase, lowercase, numbers, and special characters'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!isFirstTimeLogin && newPassword === currentPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      // Call backend API to change password
      await authService.changePassword(
        userEmail,
        isFirstTimeLogin ? '' : currentPassword,
        newPassword
      );

      toast.success('Password changed successfully');

      // Reset form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordStrength('weak');

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const strengthColor =
    passwordStrength === 'strong'
      ? 'bg-green-500'
      : passwordStrength === 'medium'
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={isFirstTimeLogin ? undefined : onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-primary-100">
            <div className="flex items-center gap-2">
              <Lock className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                {isFirstTimeLogin ? 'Set Your Password' : 'Change Password'}
              </h2>
            </div>
            {!isFirstTimeLogin && (
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>

          {isFirstTimeLogin && (
            <div className="bg-blue-50 border-b border-blue-200 p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    First-Time Login: Set Your Password
                  </p>
                  <p className="text-sm text-blue-800 mt-1">
                    For security reasons, you must set a new password to continue. This step cannot be skipped.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {!isFirstTimeLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                    placeholder="Enter current password"
                    required={!isFirstTimeLogin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => handleNewPasswordChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">Strength:</span>
                    <span className="text-xs font-medium capitalize text-gray-600">
                      {passwordStrength}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`${strengthColor} h-1.5 rounded-full transition-all`}
                      style={{
                        width:
                          passwordStrength === 'weak'
                            ? '33%'
                            : passwordStrength === 'medium'
                            ? '66%'
                            : '100%',
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    At least 8 characters with uppercase, lowercase, numbers, and special characters
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {newPassword && confirmPassword && newPassword === confirmPassword && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                )}
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <div className="absolute right-10 top-1/2 -translate-y-1/2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                )}
              </div>
              {newPassword && confirmPassword && newPassword === confirmPassword && (
                <div className="flex items-center gap-1 mt-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Passwords match</span>
                </div>
              )}
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <div className="flex items-center gap-1 mt-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">Passwords do not match</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              {!isFirstTimeLogin && (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Changing...' : isFirstTimeLogin ? 'Set Password' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
