import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { PasswordChangeModal } from '../components/modals/PasswordChangeModal';
import { ForgotPasswordModal } from '../components/modals/ForgotPasswordModal';
import ReCAPTCHA from 'react-google-recaptcha';
import { Settings, Lock } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordChangeOpen, setIsPasswordChangeOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [isFirstTimeLogin, setIsFirstTimeLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Google reCAPTCHA site key (you'll need to get this from Google reCAPTCHA admin)
  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }

    if (!captchaToken) {
      toast.error('Please complete the CAPTCHA verification');
      isValid = false;
    }

    return isValid;
  };

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      emailInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      // Send captchaToken to backend for verification
      const loggedInUser = await login(email, password, captchaToken || undefined);

      // Check if this is first-time login
      // Backend should return isFirstTimeLogin flag in response
      const isFirstTime = loggedInUser?.isFirstTimeLogin ?? false;

      if (isFirstTime) {
        // Store email for password change modal
        setLoginEmail(email);
        setIsFirstTimeLogin(true);
        setIsPasswordChangeOpen(true);
        toast.success('Logged in successfully. Please set a new password.');
      } else {
        toast.success('Logged in successfully');
        navigate('/');
      }

      // Reset captcha after successful login
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } catch (error) {
      toast.error('Invalid credentials');
      // Reset captcha on failed login
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setIsPasswordChangeOpen(false);
    setIsFirstTimeLogin(false);
    setLoginEmail('');
    toast.success('Password updated. Redirecting to dashboard...');
    // Small delay to let user see the toast
    setTimeout(() => {
      navigate('/');
    }, 1000);
  };
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950">
      {/* Animated Gears Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top Left Orange Gear */}
        <div className="absolute top-16 left-16 w-32 h-32 text-orange-400 opacity-60 animate-spin-slow">
          <Settings className="w-full h-full" />
        </div>

        {/* Top Right Gray Gear */}
        <div className="absolute top-8 right-20 w-40 h-40 text-blue-400 opacity-40 animate-spin-reverse-slow">
          <Settings className="w-full h-full" />
        </div>

        {/* Bottom Right Purple Gear */}
        <div className="absolute bottom-12 right-24 w-48 h-48 text-purple-400 opacity-50 animate-spin-slow">
          <Settings className="w-full h-full" />
        </div>

        {/* Small decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-4 h-16 bg-orange-400 opacity-50 rounded-full rotate-45"></div>
        <div className="absolute bottom-1/3 left-1/4 w-3 h-12 bg-purple-400 opacity-40 rounded-full -rotate-12"></div>
        <div className="absolute top-1/2 left-1/3 w-6 h-6 bg-blue-300 opacity-30 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/3 w-4 h-20 bg-purple-300 opacity-40 rounded-full rotate-12"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with Logo */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
            <p className="text-gray-500 text-sm">Welcome back to MyCAE Tracker</p>
          </div>

          {/* Form */}
          <form className="px-8 pb-8 space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                ref={emailInputRef}
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
                className={`w-full px-4 py-3 border ${
                  emailError ? 'border-red-300' : 'border-gray-200'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed`}
              />
              {emailError && (
                <p className="mt-1.5 text-sm text-red-600">{emailError}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className={`w-full px-4 py-3 border ${
                  passwordError ? 'border-red-300' : 'border-gray-200'
                } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed`}
              />
              {passwordError && (
                <p className="mt-1.5 text-sm text-red-600">{passwordError}</p>
              )}
            </div>

            {/* reCAPTCHA */}
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleCaptchaChange}
                theme="light"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-6 rounded-xl transition-all duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

            <div className="text-center mt-4">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                onClick={() => setIsForgotPasswordOpen(true)}
              >
                Forgot Password?
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white text-sm opacity-80">
            Powered by MyCAE Technologies
          </p>
        </div>
      </div>

      {/* Password Change Modal for First-Time Login */}
      <PasswordChangeModal
        isOpen={isPasswordChangeOpen}
        onClose={() => setIsPasswordChangeOpen(false)}
        onSuccess={handlePasswordChangeSuccess}
        isFirstTimeLogin={isFirstTimeLogin}
        userEmail={loginEmail}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

      {/* CSS for custom animations */}
      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes spin-reverse-slow {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-spin-reverse-slow {
          animation: spin-reverse-slow 25s linear infinite;
        }
      `}</style>
    </div>
  );
};
