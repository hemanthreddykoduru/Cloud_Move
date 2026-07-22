import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforge } from '../lib/insforge';

type AuthContextType = {
  user: any | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  signOut: async () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // InsForge automatically handles the OAuth callback in the browser.
    // We just need to fetch the current user.
    const checkUser = async () => {
      try {
        const { data, error } = await insforge.auth.getCurrentUser();
        if (error) {
          console.error("Auth check failed:", error);
        }
        setUser(data?.user || null);
      } catch (err) {
        console.error("Failed to get current user", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  const signOut = async () => {
    // Immediately clear local state so UI updates
    setUser(null);
    try {
      await insforge.auth.signOut();
    } catch (e) {
      console.error('Failed to sign out from backend:', e);
    }
    // Force clear all local storage to prevent sticky sessions across reloads
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <AuthContext.Provider value={{ user, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
