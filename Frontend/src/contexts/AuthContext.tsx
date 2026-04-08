import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, saveToken, clearToken } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** Call after a successful login/register response to persist the session. */
  loginUser: (token: string, userData: AuthUser) => void;
  signOut: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginUser: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, validate the stored token and restore the session
  useEffect(() => {
    const token = localStorage.getItem("geu_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((data) => setUser(data))
      .catch(() => {
        // Token expired or invalid — clear it
        clearToken();
      })
      .finally(() => setLoading(false));
  }, []);

  const loginUser = (token: string, userData: AuthUser) => {
    saveToken(token);
    setUser(userData);
  };

  const signOut = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
