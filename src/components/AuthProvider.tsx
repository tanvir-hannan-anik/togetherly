"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  error: string;
  setUser: (user: User | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const result = await api<{ user: User | null }>("/auth/me");
      setUser(result.user);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
  }

  function updateUser(nextUser: User | null) {
    setUser(nextUser);
    setError("");
    setLoading(false);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, error, setUser: updateUser, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be inside AuthProvider.");
  return context;
}
