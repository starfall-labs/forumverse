
'use client';

import type { User } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { mockUsers } from '@/lib/mock-data'; // For demo login

// Extend User type for local storage which might include password (not for production)
type StoredUser = User & { password?: string };

interface SignupData {
  email: string;
  password?: string;
  username: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
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
      if (usersStr) {
        const parsedUsers = JSON.parse(usersStr);
        // Ensure mockUsers are added if not present in localStorage for demo purposes
        const allUsers = [...parsedUsers];
        mockUsers.forEach(mockUser => {
          if (!allUsers.find(u => u.email === mockUser.email)) {
            allUsers.push({ ...mockUser, password: 'password123' }); // Add mock password for login
          }
        });
        return allUsers;
      } else {
        // Initialize with mockUsers if localStorage is empty
        const initialUsers = mockUsers.map(u => ({ ...u, password: 'password123' }));
        saveStoredUsers(initialUsers);
        return initialUsers;
      }
    } catch {
      const initialUsers = mockUsers.map(u => ({ ...u, password: 'password123' }));
      saveStoredUsers(initialUsers);
      return initialUsers;
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
    await new Promise(resolve => setTimeout(resolve, 500));

    const storedUsers = getStoredUsers();
    const userToLogin = storedUsers.find(u => u.email === email && u.password === password);


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

  const signup = useCallback(async (data: SignupData): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const storedUsers = getStoredUsers();
    if (storedUsers.find(u => u.email === data.email || u.username === data.username)) {
      setIsLoading(false);
      return false; // User email or username already exists
    }

    const newUser: StoredUser = {
      id: `user${Date.now()}`,
      email: data.email,
      username: data.username,
      displayName: data.displayName || undefined, // Ensure it's undefined if empty
      password: data.password, // Store password for mock login
      avatarUrl: `https://placehold.co/40x40.png?text=${(data.displayName || data.username || data.email).charAt(0).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };

    saveStoredUsers([...storedUsers, newUser]);

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
