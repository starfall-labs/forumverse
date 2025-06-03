'use client';

import type { User } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { mockUsers } from '@/lib/mock-data'; // For demo login

// Extend User type for local storage which might include password (not for production)
type StoredUser = User & { password?: string };

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<boolean>; // Password for mock, not real SMTP
  signup: (email: string, password?: string) => Promise<boolean>; // Password for mock
  logout: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_USERS_STORAGE_KEY = 'forumverse_users';
const CURRENT_USER_STORAGE_KEY = 'forumverse_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStoredUsers = (): StoredUser[] => {
    try {
      const usersStr = localStorage.getItem(FAKE_USERS_STORAGE_KEY);
      return usersStr ? JSON.parse(usersStr) : [];
    } catch {
      return [];
    }
  };

  const saveStoredUsers = (users: StoredUser[]) => {
    try {
      localStorage.setItem(FAKE_USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save users to localStorage", error);
    }
  };


  const login = useCallback(async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const storedUsers = getStoredUsers();
    const existingUser = storedUsers.find(u => u.email === email && u.password === password); // Simple check for demo
    // Or, use one of the mock users if no stored users or for easier demo
    const demoUser = mockUsers.find(u => u.email === email);

    const userToLogin = existingUser || (demoUser && password === 'password123' ? demoUser : null) ;


    if (userToLogin) {
      const { password: _p, ...userWithoutPassword } = userToLogin;
      setUser(userWithoutPassword);
      try {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userWithoutPassword));
      } catch (error) {
        console.error("Failed to save current user to localStorage", error);
      }
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    return false;
  }, []);

  const signup = useCallback(async (email: string, password?: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const storedUsers = getStoredUsers();
    if (storedUsers.find(u => u.email === email)) {
      setIsLoading(false);
      return false; // User already exists
    }

    const newUser: StoredUser = {
      id: `user${Date.now()}`,
      email,
      password, // Store password for mock login
      avatarUrl: `https://placehold.co/40x40.png?text=${email.charAt(0).toUpperCase()}`
    };
    
    saveStoredUsers([...storedUsers, newUser]);
    
    // Automatically log in after signup
    const { password: _p, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    try {
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userWithoutPassword));
    } catch (error) {
      console.error("Failed to save current user to localStorage", error);
    }
    setIsLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to remove current user from localStorage", error);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
