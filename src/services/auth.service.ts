import { httpClient, api } from './http-client';
import { logger } from '../lib/logger';

/**
 * Authentication Service
 *
 * Handles all authentication-related operations:
 * - User registration
 * - Login/logout
 * - Password management
 * - User profile
 */

class AuthService {
  /**
   * Register a new user
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      httpClient.setAuthToken(response.data.token);
    }
    return response.data;
  }

  /**
   * Login user
   */
  async login(email: string, password: string, captchaToken?: string) {
    logger.debug('AuthService: Sending login request', { hasCaptcha: !!captchaToken });

    try {
      const response = await api.post('/auth/login', { email, password, captchaToken });
      logger.debug('AuthService: Login response received', { status: response.status });

      // Validate response structure
      if (!response?.data) {
        throw new Error('Invalid response from server: expected object');
      }

      if (!response.data.token) {
        logger.warn('AuthService: No token in response');
        throw new Error('Server did not return authentication token');
      }

      if (!response.data.user) {
        logger.warn('AuthService: No user data in response');
        throw new Error('Server did not return user data');
      }

      logger.debug('AuthService: Token found, setting auth token');
      httpClient.setAuthToken(response.data.token);

      return response.data;
    } catch (error) {
      logger.axiosError('AuthService: Login failed', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    httpClient.clearAuth();
  }

  /**
   * Change user password
   */
  async changePassword(email: string, currentPassword: string, newPassword: string) {
    const response = await api.post('/auth/change-password', {
      email,
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  /**
   * Update user avatar (preset avatar ID)
   */
  async updateUserAvatar(avatarId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch('/users/avatar', { avatarId });
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<any> {
    const response = await api.get('/users/profile');
    return response.data;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return httpClient.isAuthenticated();
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return httpClient.getToken();
  }
}

// Export singleton instance
export default new AuthService();
