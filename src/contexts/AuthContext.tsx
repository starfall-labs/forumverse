
'use client';

import type { User } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { initialMockUsers } from '@/lib/mock-data'; // Use initialMockUsers

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
        const parsedUsers = JSON.parse(usersStr) as StoredUser[];
        // Ensure initialMockUsers are added if not present in localStorage for demo purposes
        const allUsersMap = new Map(parsedUsers.map(u => [u.email, u]));
        initialMockUsers.forEach(mockUser => {
          if (!allUsersMap.has(mockUser.email)) {
            allUsersMap.set(mockUser.email, { ...mockUser, password: 'password123' }); // Add mock password for login
          }
        });
        const updatedUsers = Array.from(allUsersMap.values());
        if (usersStr !== JSON.stringify(updatedUsers)) { // Avoid rewriting if no changes
            saveStoredUsers(updatedUsers);
        }
        return updatedUsers;
      } else {
        // Initialize with initialMockUsers if localStorage is empty
        const initialUsersWithPassword = initialMockUsers.map(u => ({ ...u, password: 'password123' }));
        saveStoredUsers(initialUsersWithPassword);
        return initialUsersWithPassword;
      }
    } catch {
      const initialUsersWithPassword = initialMockUsers.map(u => ({ ...u, password: 'password123' }));
      saveStoredUsers(initialUsersWithPassword);
      return initialUsersWithPassword;
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
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

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
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay

    const storedUsers = getStoredUsers();
    if (storedUsers.find(u => u.email === data.email || u.username === data.username)) {
      setIsLoading(false);
      return false; // User email or username already exists
    }

    const newUser: StoredUser = {
      id: `user${Date.now()}`,
      email: data.email,
      username: data.username,
      displayName: data.displayName || data.username, // Default displayName to username if not provided
      password: data.password, // Store password for mock login
      avatarUrl: `https://placehold.co/40x40.png?text=${(data.displayName || data.username).charAt(0).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };

    saveStoredUsers([...storedUsers, newUser]);

    // Also add to the global in-memory store for current session consistency if needed by other parts
    if (global.mockDataStore && global.mockDataStore.users) {
        const { password: _p, ...userForGlobalStore } = newUser;
        global.mockDataStore.users.push(userForGlobalStore);
    }


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
