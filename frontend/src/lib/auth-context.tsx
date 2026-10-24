"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "@/lib/api";
import { AuthUser } from "@/types";

const TOKEN_KEY = "token";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  requestSignupOtp: (name: string, email: string, password: string) => Promise<void>;
  verifySignupOtp: (email: string, code: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await api.get<AuthUser>("/users/me"));
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Mount-time hydration from localStorage — there is no "previous render" to
    // diff against, so this isn't the synchronous-setState pattern the rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  async function login(email: string, password: string) {
    const { token, user: loggedInUser } = await api.post<{ token: string; user: AuthUser }>(
      "/auth/login",
      { email, password },
    );
    localStorage.setItem(TOKEN_KEY, token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function requestSignupOtp(name: string, email: string, password: string) {
    await api.post<{ message: string }>("/auth/signup/request-otp", { name, email, password });
  }

  async function verifySignupOtp(email: string, code: string) {
    const { token, user: newUser } = await api.post<{ token: string; user: AuthUser }>(
      "/auth/signup/verify-otp",
      { email, code },
    );
    localStorage.setItem(TOKEN_KEY, token);
    setUser(newUser);
    return newUser;
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, requestSignupOtp, verifySignupOtp, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
