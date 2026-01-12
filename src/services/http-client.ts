import axios, { AxiosInstance } from 'axios';

/**
 * Base HTTP Client
 *
 * Provides a configured axios instance with:
 * - Authentication token management
 * - Request/response interceptors
 * - Automatic redirect on 401 (unauthorized)
 */

// Helper function to transform snake_case to camelCase
const snakeToCamel = (str: string): string => {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
};

// Transform object keys from snake_case to camelCase
export const transformKeysToCAmelCase = (obj: any): any => {
  try {
    if (Array.isArray(obj)) {
      return obj.map(item => transformKeysToCAmelCase(item));
    } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
      return Object.keys(obj).reduce((result, key) => {
        const camelKey = snakeToCamel(key);
        const value = obj[key];
        result[camelKey] = (value !== null && typeof value === 'object' && !(value instanceof Date))
          ? transformKeysToCAmelCase(value)
          : value;
        return result;
      }, {} as any);
    }
    return obj;
  } catch (error) {
    console.error('Error in transformKeysToCAmelCase:', error);
    return obj;
  }
};

class HttpClient {
  public api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    // API base URL - uses environment variable in production, Vite proxy in development
    const baseURL = import.meta.env.VITE_API_URL || '/api';
    console.log('🔧 HTTP Client initialized with baseURL:', baseURL);

    this.api = axios.create({
      baseURL,
      timeout: 30000, // Increased timeout to 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
    if (this.token) {
      this.setAuthToken(this.token);
    }

    // Response interceptor for token refresh
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Check if this is a login request - don't redirect, let it handle the error
          const isLoginRequest = error.config?.url?.includes('/auth/login');

          if (!isLoginRequest) {
            // Token expired or invalid - only redirect for non-login requests
            this.clearAuth();
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string) {
    this.token = token;
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  }

  /**
   * Clear authentication
   */
  clearAuth() {
    this.token = null;
    delete this.api.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Environment helpers
   */
  isProduction(): boolean {
    return import.meta.env.PROD;
  }

  getEnvironmentInfo(): { isProduction: boolean; url: string } {
    return {
      isProduction: this.isProduction(),
      url: this.api.defaults.baseURL || 'Unknown',
    };
  }
}

// Export singleton instance
export const httpClient = new HttpClient();

// Export the axios instance for direct use
export const api = httpClient.api;
