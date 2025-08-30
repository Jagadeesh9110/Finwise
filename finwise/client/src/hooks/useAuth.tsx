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

// The AuthContextType is now simpler. It doesn't need a 'login' function
// because the login page will handle the API call directly.
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

  // This function checks if the user is authenticated by calling the backend.
  // The browser will automatically send the httpOnly cookie with the request.
  const checkAuthStatus = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await apiClient<User>("/auth/profile");
      setUser(profile);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const logout = async () => {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
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
