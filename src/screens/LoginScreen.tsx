import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { PasswordChangeModal } from '../components/modals/PasswordChangeModal';
import { ForgotPasswordModal } from '../components/modals/ForgotPasswordModal';
import ReCAPTCHA from 'react-google-recaptcha';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { logger } from '../lib/logger';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (!RECAPTCHA_SITE_KEY) {
    console.error('❌ VITE_RECAPTCHA_SITE_KEY environment variable is not set');
  }

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
    } catch (error: any) {
      // Show detailed error message from backend
      const errorMessage = error?.response?.data?.error || error?.message || 'Invalid credentials. Please try again.';
      toast.error(errorMessage);
      logger.error('Login error:', error);

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
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* CFD/FEA Style Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Mesh Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mesh-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="0.5"/>
            </pattern>
            <pattern id="mesh-dots" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="1" fill="rgba(96, 165, 250, 0.6)"/>
              <circle cx="40" cy="0" r="1" fill="rgba(96, 165, 250, 0.6)"/>
              <circle cx="0" cy="40" r="1" fill="rgba(96, 165, 250, 0.6)"/>
              <circle cx="40" cy="40" r="1" fill="rgba(96, 165, 250, 0.6)"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mesh-grid)"/>
          <rect width="100%" height="100%" fill="url(#mesh-dots)"/>
        </svg>

        {/* CFD Flow Streamlines */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="flow-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(239, 68, 68, 0)" />
              <stop offset="30%" stopColor="rgba(239, 68, 68, 0.6)" />
              <stop offset="50%" stopColor="rgba(251, 191, 36, 0.8)" />
              <stop offset="70%" stopColor="rgba(34, 197, 94, 0.6)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
            </linearGradient>
            <linearGradient id="flow-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0)" />
              <stop offset="20%" stopColor="rgba(59, 130, 246, 0.5)" />
              <stop offset="50%" stopColor="rgba(147, 51, 234, 0.7)" />
              <stop offset="80%" stopColor="rgba(236, 72, 153, 0.5)" />
              <stop offset="100%" stopColor="rgba(236, 72, 153, 0)" />
            </linearGradient>
          </defs>

          {/* Animated Flow Lines */}
          <path className="flow-line-1" d="M-100,150 Q200,100 400,180 T800,120 T1200,200 T1600,140"
                fill="none" stroke="url(#flow-gradient-1)" strokeWidth="3" opacity="0.7"/>
          <path className="flow-line-2" d="M-100,250 Q150,300 350,220 T700,280 T1100,200 T1500,260"
                fill="none" stroke="url(#flow-gradient-2)" strokeWidth="2" opacity="0.5"/>
          <path className="flow-line-3" d="M-100,450 Q250,400 450,480 T850,420 T1250,500 T1650,440"
                fill="none" stroke="url(#flow-gradient-1)" strokeWidth="2.5" opacity="0.6"/>
          <path className="flow-line-4" d="M-100,600 Q200,550 400,620 T800,560 T1200,640 T1600,580"
                fill="none" stroke="url(#flow-gradient-2)" strokeWidth="2" opacity="0.4"/>
        </svg>

        {/* FEA Contour/Heat Map Areas */}
        <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-gradient-radial from-red-500/20 via-orange-500/10 to-transparent blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-radial from-blue-500/25 via-cyan-500/10 to-transparent blur-3xl animate-pulse-slow-delayed"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-purple-500/15 via-indigo-500/5 to-transparent blur-3xl"></div>

        {/* Velocity Vectors / Arrows */}
        <div className="absolute top-20 left-20 opacity-40">
          <svg width="60" height="20" viewBox="0 0 60 20">
            <defs>
              <marker id="arrowhead1" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(34, 197, 94, 0.8)" />
              </marker>
            </defs>
            <line x1="0" y1="10" x2="50" y2="10" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2" markerEnd="url(#arrowhead1)" />
          </svg>
        </div>
        <div className="absolute top-32 left-32 opacity-50">
          <svg width="80" height="20" viewBox="0 0 80 20">
            <line x1="0" y1="10" x2="70" y2="10" stroke="rgba(251, 191, 36, 0.8)" strokeWidth="2.5" markerEnd="url(#arrowhead1)" />
          </svg>
        </div>
        <div className="absolute bottom-40 right-40 opacity-40 rotate-[-15deg]">
          <svg width="70" height="20" viewBox="0 0 70 20">
            <line x1="0" y1="10" x2="60" y2="10" stroke="rgba(239, 68, 68, 0.7)" strokeWidth="2" markerEnd="url(#arrowhead1)" />
          </svg>
        </div>
        <div className="absolute bottom-60 right-60 opacity-50 rotate-[-10deg]">
          <svg width="90" height="20" viewBox="0 0 90 20">
            <line x1="0" y1="10" x2="80" y2="10" stroke="rgba(251, 191, 36, 0.8)" strokeWidth="2" markerEnd="url(#arrowhead1)" />
          </svg>
        </div>

        {/* Pressure/Stress Points */}
        <div className="absolute top-1/4 right-1/4 w-8 h-8 rounded-full bg-red-500/50 blur-sm animate-ping-slow"></div>
        <div className="absolute bottom-1/3 left-1/5 w-6 h-6 rounded-full bg-orange-500/40 blur-sm animate-ping-slow-delayed"></div>
        <div className="absolute top-2/3 right-1/3 w-10 h-10 rounded-full bg-yellow-500/30 blur-md animate-pulse-slow"></div>

        {/* Mesh Deformation Lines */}
        <svg className="absolute bottom-0 left-0 w-full h-48 opacity-30" viewBox="0 0 1200 200" preserveAspectRatio="none">
          <path d="M0,100 Q150,60 300,100 T600,80 T900,120 T1200,90" fill="none" stroke="rgba(96, 165, 250, 0.6)" strokeWidth="1"/>
          <path d="M0,120 Q150,80 300,120 T600,100 T900,140 T1200,110" fill="none" stroke="rgba(96, 165, 250, 0.5)" strokeWidth="1"/>
          <path d="M0,140 Q150,100 300,140 T600,120 T900,160 T1200,130" fill="none" stroke="rgba(96, 165, 250, 0.4)" strokeWidth="1"/>
          <path d="M0,160 Q150,120 300,160 T600,140 T900,180 T1200,150" fill="none" stroke="rgba(96, 165, 250, 0.3)" strokeWidth="1"/>
        </svg>

        {/* Color Scale Legend (decorative) */}
        <div className="absolute bottom-8 left-8 flex flex-col gap-0.5 opacity-60">
          <div className="w-4 h-3 bg-red-500 rounded-sm"></div>
          <div className="w-4 h-3 bg-orange-500 rounded-sm"></div>
          <div className="w-4 h-3 bg-yellow-500 rounded-sm"></div>
          <div className="w-4 h-3 bg-green-500 rounded-sm"></div>
          <div className="w-4 h-3 bg-cyan-500 rounded-sm"></div>
          <div className="w-4 h-3 bg-blue-500 rounded-sm"></div>
          <span className="text-[8px] text-blue-300 mt-1">Velocity</span>
        </div>
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
            <p className="text-gray-500 text-sm">Welcome back to MyCAE Technologies App</p>
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
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className={`w-full px-4 py-3 pr-10 border ${
                    passwordError ? 'border-red-300' : 'border-gray-200'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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

      {/* CSS for CFD/FEA animations */}
      <style>{`
        @keyframes flow-animate {
          0% {
            stroke-dashoffset: 1000;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }

        @keyframes pulse-slow-delayed {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.08);
          }
        }

        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.2;
          }
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
        }

        @keyframes ping-slow-delayed {
          0% {
            transform: scale(1);
            opacity: 0.4;
          }
          60% {
            transform: scale(1.3);
            opacity: 0.15;
          }
          100% {
            transform: scale(1);
            opacity: 0.4;
          }
        }

        .flow-line-1, .flow-line-2, .flow-line-3, .flow-line-4 {
          stroke-dasharray: 20 10;
          animation: flow-animate 8s linear infinite;
        }

        .flow-line-2 {
          animation-delay: -2s;
          animation-duration: 10s;
        }

        .flow-line-3 {
          animation-delay: -4s;
          animation-duration: 12s;
        }

        .flow-line-4 {
          animation-delay: -6s;
          animation-duration: 9s;
        }

        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }

        .animate-pulse-slow-delayed {
          animation: pulse-slow-delayed 8s ease-in-out infinite;
          animation-delay: -3s;
        }

        .animate-ping-slow {
          animation: ping-slow 4s ease-in-out infinite;
        }

        .animate-ping-slow-delayed {
          animation: ping-slow-delayed 5s ease-in-out infinite;
          animation-delay: -2s;
        }

        .bg-gradient-radial {
          background: radial-gradient(circle, var(--tw-gradient-stops));
        }
      `}</style>
    </div>
  );
};
