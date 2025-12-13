import React, { createContext, useContext, useState } from 'react';
import type { User, AuthContextType } from '../types/auth.types';
import { checkPermission, RolePermissions } from '../lib/permissions';
import apiService from '../services/api.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (email: string, password: string, captchaToken?: string): Promise<User & { isFirstTimeLogin?: boolean }> => {
    // Call backend API for authentication
    try {
      const response = await apiService.login(email, password, captchaToken);
      const { user: loggedInUser, token, isFirstTimeLogin } = response;

      // Attach isFirstTimeLogin flag to user object for consumption by caller
      const userWithFlag = { ...loggedInUser, isFirstTimeLogin };

      // Store user and token (use 'auth_token' to match api.service.ts)
      setUser(loggedInUser);
      localStorage.setItem('currentUser', JSON.stringify(loggedInUser));
      localStorage.setItem('auth_token', token);

      return userWithFlag;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('auth_token');
  };

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!user) return false;
    return checkPermission(user.role, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
