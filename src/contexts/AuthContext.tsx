
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
  // isAdmin: boolean; // Removed: isAdmin will be part of the user object
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
        const allUsersMap = new Map(parsedUsers.map(u => [u.email, u]));
        initialMockUsers.forEach(mockUser => {
          if (!allUsersMap.has(mockUser.email)) {
            allUsersMap.set(mockUser.email, { ...mockUser, password: 'password123', isAdmin: mockUser.isAdmin || false });
          } else {
            // Ensure existing users also have isAdmin flag correctly from initialMockUsers
             const existingUser = allUsersMap.get(mockUser.email)!;
             const initialMockEquivalent = initialMockUsers.find(imu => imu.email === existingUser.email);
             if (initialMockEquivalent && existingUser.isAdmin !== initialMockEquivalent.isAdmin) {
                allUsersMap.set(mockUser.email, {...existingUser, isAdmin: initialMockEquivalent.isAdmin });
             }
          }
        });
        const updatedUsers = Array.from(allUsersMap.values());
        if (usersStr !== JSON.stringify(updatedUsers)) { 
            saveStoredUsers(updatedUsers);
        }
        return updatedUsers;
      } else {
        const initialUsersWithDetails = initialMockUsers.map(u => ({ ...u, password: 'password123', isAdmin: u.isAdmin || false }));
        saveStoredUsers(initialUsersWithDetails);
        return initialUsersWithDetails;
      }
    } catch {
      const initialUsersWithDetails = initialMockUsers.map(u => ({ ...u, password: 'password123', isAdmin: u.isAdmin || false }));
      saveStoredUsers(initialUsersWithDetails);
      return initialUsersWithDetails;
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
      // Ensure isAdmin flag is correctly set from the source
      const finalUserObject = { ...userWithoutPassword, isAdmin: userToLogin.isAdmin || false };
      setUser(finalUserObject);
      try {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(finalUserObject));
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
      return false; 
    }

    const newUser: StoredUser = {
      id: `user${Date.now()}`,
      email: data.email,
      username: data.username,
      displayName: data.displayName || data.username, 
      password: data.password, 
      avatarUrl: `https://placehold.co/40x40.png?text=${(data.displayName || data.username).charAt(0).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      isAdmin: false, // New users are not admins by default
    };

    saveStoredUsers([...storedUsers, newUser]);

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
