import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, saveToken, clearToken, type AuthUser } from "@/lib/api";

export type { AuthUser };

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** Persist a session right after a successful login. */
  loginUser: (token: string, userData: AuthUser) => void;
  /** Refresh user from /me — useful after must_change_password is cleared. */
  refresh: () => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  loginUser: () => {},
  refresh: async () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("geu_token");
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then((data) => setUser(data))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const loginUser = (token: string, userData: AuthUser) => {
    saveToken(token);
    setUser(userData);
  };

  const refresh = async () => {
    try { setUser(await authApi.me()); } catch { /* ignore */ }
  };

  const signOut = () => { clearToken(); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
