import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { httpClient } from '../services/http-client';
import toast from 'react-hot-toast';

export const ResetPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(false);

  // Verify token if present in URL
  useEffect(() => {
    if (token) {
      verifyToken(token);
    }
  }, [token]);

  const verifyToken = async (resetToken: string) => {
    setVerifyingToken(true);
    try {
      const response = await httpClient.api.post('/auth/verify-reset-token', {
        token: resetToken,
      });

      if (response.data.valid) {
        setTokenValid(true);
        setStep('reset');
        setEmail(response.data.email);
      } else {
        toast.error('Invalid or expired reset link');
        setStep('request');
      }
    } catch (error: any) {
      console.error('Token verification error:', error);
      toast.error(error.response?.data?.error || 'Invalid or expired reset link');
      setStep('request');
    } finally {
      setVerifyingToken(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);

    try {
      await httpClient.api.post('/auth/forgot-password', { email });
      toast.success('Password reset link sent! Check your email.');
      setStep('success');
    } catch (error: any) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.error || 'Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 12) {
      toast.error('Password must be at least 12 characters');
      return;
    }

    setIsLoading(true);

    try {
      await httpClient.api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      toast.success('Password reset successful!');
      setStep('success');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (verifyingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Back to Login Button */}
        {step !== 'success' && (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        )}

        {/* Request Reset Link */}
        {step === 'request' && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
              <p className="text-gray-600 mt-2">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </>
        )}

        {/* Reset Password Form */}
        {step === 'reset' && tokenValid && (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
              <p className="text-gray-600 mt-2">
                Enter your new password for <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-10"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Must be at least 12 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </form>
          </>
        )}

        {/* Success Message */}
        {step === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {token ? 'Password Reset!' : 'Email Sent!'}
            </h1>
            <p className="text-gray-600 mb-6">
              {token
                ? 'Your password has been successfully reset. Redirecting to login...'
                : 'If an account exists with that email, we\'ve sent a password reset link. Please check your inbox.'}
            </p>
            {!token && (
              <Button
                onClick={() => navigate('/login')}
                variant="primary"
                className="w-full"
              >
                Back to Login
              </Button>
            )}
          </div>
        )}

        {/* Security Notice */}
        {step !== 'success' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Security Notice</p>
                <p className="mt-1">
                  The reset link will expire in 1 hour. Never share this link with anyone.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
