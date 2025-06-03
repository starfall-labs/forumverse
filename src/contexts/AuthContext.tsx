
'use client';

import type { User } from '@/lib/types';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { createNewUserAction, getUserByIdAction } from '@/actions/threadActions'; // Using actions

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

const CURRENT_USER_STORAGE_KEY = 'forumverse_current_user_auth_info'; 

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(null); 
  const [isLoading, setIsLoading] = useState(true);

  const updateAuthUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (typeof localStorage !== 'undefined') {
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
    }
  }, []);


  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      if (typeof localStorage !== 'undefined') {
        try {
          const storedUserJson = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
          if (storedUserJson) {
            const storedUser = JSON.parse(storedUserJson) as User;
            const liveUser = await getUserByIdAction(storedUser.id);
            if (isMounted) {
              if (liveUser) {
                  // Ensure isOwner and isAdmin flags are correctly passed from liveUser
                  const { password, ...userToContext } = liveUser;
                  updateAuthUser(userToContext);
              } else {
                  updateAuthUser(null); 
              }
            }
          }
        } catch (error) {
          console.error("Failed to load user from localStorage", error);
          if (isMounted) updateAuthUser(null);
        } finally {
          if (isMounted) setIsLoading(false);
        }
      } else {
         if (isMounted) {
            updateAuthUser(null);
            setIsLoading(false);
         }
      }
    }
    loadUser();
    return () => { isMounted = false; };
  }, [updateAuthUser]);


  const login = useCallback(async (email: string, passwordAttempt?: string): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 300)); 

    const userToLogin = global.mockDataStore?.users.find(u => u.email === email && u.password === passwordAttempt);

    if (userToLogin) {
      const { password, ...userWithoutPassword } = userToLogin;
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
    await new Promise(resolve => setTimeout(resolve, 300)); 

    const result = await createNewUserAction({
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        password: data.password,
        // New users are not admin or owner by default
        isAdmin: false,
        isOwner: false,
    });

    if ('error' in result) {
        setIsLoading(false);
        return false;
    } else {
        updateAuthUser(result);
        setIsLoading(false);
        return true;
    }
  }, [updateAuthUser]);

  const logout = useCallback(() => {
    updateAuthUser(null);
    if (typeof window !== 'undefined') {
        window.location.href = '/login'; 
    }
  }, [updateAuthUser]);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, updateAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
};
