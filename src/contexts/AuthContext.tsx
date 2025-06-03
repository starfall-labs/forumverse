
'use client';

import type { User } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { initialMockUsers } from '@/lib/mock-data'; 

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
  updateAuthUser: (updatedUser: User | null) => void; 
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FAKE_USERS_STORAGE_KEY = 'forumverse_users';
const CURRENT_USER_STORAGE_KEY = 'forumverse_current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null); 
  const [isLoading, setIsLoading] = useState(true);

  const updateAuthUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      const { password, ...userToStore } = newUser; // Ensure password is not stored in localStorage for current user
      try {
        localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(userToStore));
      } catch (error) {
        console.error("Failed to save current user to localStorage", error);
      }
    } else {
      try {
        localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
      } catch (error) {
        console.error("Failed to remove current user from localStorage", error);
      }
    }
  }, []);


  useEffect(() => {
    try {
      const storedUserJson = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
      if (storedUserJson) {
        const storedUser = JSON.parse(storedUserJson) as User;
        // Re-fetch from "DB" to ensure data consistency, especially isAdmin status
        const usersInDb = getStoredUsers(); // This function now manages the mock DB with isAdmin flags
        const liveUser = usersInDb.find(u => u.id === storedUser.id);
        if (liveUser) {
            const { password, ...userToContext } = liveUser;
            updateAuthUser(userToContext);
        } else {
            updateAuthUser(null); // User in localStorage no longer in "DB"
        }
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      updateAuthUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [updateAuthUser]);

  const getStoredUsers = (): StoredUser[] => {
    try {
      const usersStr = localStorage.getItem(FAKE_USERS_STORAGE_KEY);
      if (usersStr) {
        const parsedUsers = JSON.parse(usersStr) as StoredUser[];
        const allUsersMap = new Map(parsedUsers.map(u => [u.id, u])); // Use ID as key
        
        initialMockUsers.forEach(mockUser => {
          const existingUser = allUsersMap.get(mockUser.id);
          if (!existingUser) {
            allUsersMap.set(mockUser.id, { ...mockUser, password: 'password123', isAdmin: mockUser.isAdmin || false, followingIds: mockUser.followingIds || [], followerIds: mockUser.followerIds || [] });
          } else {
             // Ensure existing users have isAdmin, followingIds, followerIds correctly from initialMockUsers if not present
             const updatedExistingUser = {
                ...existingUser,
                isAdmin: existingUser.isAdmin !== undefined ? existingUser.isAdmin : (mockUser.isAdmin || false),
                followingIds: existingUser.followingIds || mockUser.followingIds || [],
                followerIds: existingUser.followerIds || mockUser.followerIds || [],
             };
             if (JSON.stringify(existingUser) !== JSON.stringify(updatedExistingUser)) {
                 allUsersMap.set(mockUser.id, updatedExistingUser);
             }
          }
        });
        const updatedUsers = Array.from(allUsersMap.values());
        if (usersStr !== JSON.stringify(updatedUsers)) { 
            saveStoredUsers(updatedUsers);
        }
        return updatedUsers;
      } else {
        const initialUsersWithDetails = initialMockUsers.map(u => ({ ...u, password: 'password123', isAdmin: u.isAdmin || false, followingIds: u.followingIds || [], followerIds: u.followerIds || [] }));
        saveStoredUsers(initialUsersWithDetails);
        return initialUsersWithDetails;
      }
    } catch (error) {
      console.error("Error in getStoredUsers:", error);
      const initialUsersWithDetails = initialMockUsers.map(u => ({ ...u, password: 'password123', isAdmin: u.isAdmin || false, followingIds: u.followingIds || [], followerIds: u.followerIds || [] }));
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
      updateAuthUser(userWithoutPassword); 
      setIsLoading(false);
      return true;
    }
    setIsLoading(false);
    updateAuthUser(null);
    return false;
  }, [updateAuthUser]);

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
      isAdmin: false, 
      followingIds: [],
      followerIds: [],
    };

    saveStoredUsers([...storedUsers, newUser]);

    if (global.mockDataStore && global.mockDataStore.users) {
        const { password: _p, ...userForGlobalStore } = newUser;
        global.mockDataStore.users.push(userForGlobalStore);
    }

    const { password: _p2, ...userWithoutPassword } = newUser;
    updateAuthUser(userWithoutPassword);
    setIsLoading(false);
    return true;
  }, [updateAuthUser]);

  const logout = useCallback(() => {
    updateAuthUser(null);
  }, [updateAuthUser]);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, updateAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
};
