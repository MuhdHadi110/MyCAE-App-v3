/**
 * Auth helper utilities
 * Temporary helpers until full authentication context is implemented
 */

export interface CurrentUser {
  displayName: string;
  email: string;
  userId?: string;
  role?: string;
  roles?: string[]; // Multi-role support
  id?: string;
  name?: string;
  department?: string;
}

/**
 * Get current user from localStorage
 * Reads from both old format (individual keys) and new AuthContext format (JSON)
 */
export function getCurrentUser(): CurrentUser {
  // First try to read from AuthContext format (newer)
  const storedUserJson = localStorage.getItem('currentUser');
  if (storedUserJson) {
    try {
      const user = JSON.parse(storedUserJson);
      const userId = user.id || user.userId || '1';
      const userName = user.name || user.displayName || 'User';
      return {
        displayName: userName,
        email: user.email || 'user@mycae.com.my',
        userId: userId,
        id: userId,
        name: userName,
        role: user.role || (user.roles && user.roles[0]) || 'engineer',
        roles: user.roles || (user.role ? [user.role] : ['engineer']),
        department: user.department || 'engineering',
      };
    } catch (e) {
      // Fall through to old format if JSON parse fails
    }
  }

  // Fall back to old format (individual keys)
  const userId = localStorage.getItem('user_id') || '1';
  const userName = localStorage.getItem('user_name') || 'User';
  return {
    displayName: userName,
    email: localStorage.getItem('user_email') || 'user@mycae.com.my',
    userId: userId,
    id: userId,
    name: userName,
    role: localStorage.getItem('user_role') || 'engineer',
  };
}

/**
 * Set current user in localStorage
 */
export function setCurrentUser(user: CurrentUser): void {
  localStorage.setItem('user_name', user.displayName);
  localStorage.setItem('user_email', user.email);
  if (user.userId) localStorage.setItem('user_id', user.userId);
  if (user.role) localStorage.setItem('user_role', user.role);
}

/**
 * Clear current user from localStorage
 */
export function clearCurrentUser(): void {
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_role');
  localStorage.removeItem('auth_token');
}
