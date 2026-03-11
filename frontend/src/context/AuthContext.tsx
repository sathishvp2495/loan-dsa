import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { apiFetch } from "../lib/api";
import type { Agent } from "../types";

type AuthContextType = {
  token: string | null;
  user: Agent | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "loan_dsa_token";
const USER_KEY = "loan_dsa_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<Agent | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      user,
      async login(email: string, password: string) {
        const result = await apiFetch<{ token: string; user: Agent }>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password })
        });

        setToken(result.token);
        setUser(result.user);
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      },
      logout() {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return ctx;
}
