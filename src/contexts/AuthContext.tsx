import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "officer";
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: "student" | "officer") => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userStr = localStorage.getItem("auth_user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        setState((s) => ({ ...s, isLoading: false }));
      }
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // TODO: Replace mock with real API call when backend is ready
    // const res = await fetch(`${BASE_URL}/auth/login`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email, password }),
    // });
    // if (!res.ok) throw new Error("Invalid credentials");
    // const data = await res.json();

    await new Promise((r) => setTimeout(r, 800));

    // Mock: determine role from email
    const isOfficer = email.includes("officer") || email.includes("admin");
    const data = {
      token: `mock_jwt_${Date.now()}`,
      user: {
        id: `user_${Date.now()}`,
        name: email.split("@")[0],
        email,
        role: isOfficer ? "officer" as const : "student" as const,
      },
    };

    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, role: "student" | "officer") => {
    // TODO: Replace mock with real API call
    // const res = await fetch(`${BASE_URL}/auth/signup`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ name, email, password, role }),
    // });
    // if (!res.ok) throw new Error("Signup failed");
    // const data = await res.json();

    await new Promise((r) => setTimeout(r, 800));

    const data = {
      token: `mock_jwt_${Date.now()}`,
      user: { id: `user_${Date.now()}`, name, email, role },
    };

    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_user", JSON.stringify(data.user));
    setState({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
