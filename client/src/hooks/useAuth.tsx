import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

import { apiClient } from "@/lib/apiClient";

interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if the user is authenticated by calling the backend
  const checkAuthStatus = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await apiClient<User>("/auth/profile", {
        method: "GET",
        credentials: "include", 
      });
      setUser(profile);
      // Store user ID for other components to use
      if (profile.id) {
        localStorage.setItem("userId", profile.id);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      setUser(null);
      localStorage.removeItem("userId");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Logout the user by clearing the session on the backend
  const logout = async () => {
    try {
      await apiClient("/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
      localStorage.removeItem("userId");
    }
  };

  const value = { user, loading, logout, checkAuthStatus };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}