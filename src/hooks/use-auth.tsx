"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function setAccessCookie(token: string) {
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `access_token=${token}; path=/; max-age=900; samesite=lax${secure}`;
}

function clearAccessCookie() {
  document.cookie =
    "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const accessTokenRef = React.useRef<string | null>(null);

  // Mutex: deduplicate concurrent refresh calls
  const refreshPromiseRef = React.useRef<Promise<string | null> | null>(null);

  // Set to true on logout so any in-flight refresh discards its result
  const isLoggedOutRef = React.useRef(false);

  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    refreshPromiseRef.current = (async () => {
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST" });
        if (!res.ok || isLoggedOutRef.current) {
          clearAccessCookie();
          accessTokenRef.current = null;
          return null;
        }
        const data = await res.json();
        if (isLoggedOutRef.current) {
          accessTokenRef.current = null;
          return null;
        }
        setAccessToken(data.accessToken);
        accessTokenRef.current = data.accessToken;
        setAccessCookie(data.accessToken);
        return data.accessToken;
      } catch {
        accessTokenRef.current = null;
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    return refreshPromiseRef.current;
  }, []);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      let token = accessTokenRef.current;

      const doFetch = (t: string | null) =>
        fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
          },
        });

      let res = await doFetch(token);

      if (res.status === 401) {
        token = await refreshAccessToken();
        if (token) {
          res = await doFetch(token);
        }
      }

      return res;
    },
    [refreshAccessToken],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de connexion");
      }

      const data = await res.json();
      isLoggedOutRef.current = false;
      setUser(data.user);
      setAccessToken(data.accessToken);
      accessTokenRef.current = data.accessToken;
      setAccessCookie(data.accessToken);
      router.push("/dashboard");
    },
    [router],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur d'inscription");
      }

      const data = await res.json();
      isLoggedOutRef.current = false;
      setUser(data.user);
      setAccessToken(data.accessToken);
      accessTokenRef.current = data.accessToken;
      setAccessCookie(data.accessToken);
      router.push("/dashboard");
    },
    [router],
  );

  const logout = useCallback(async () => {
    // Block any in-flight or future refresh from reinstating the session
    isLoggedOutRef.current = true;
    refreshPromiseRef.current = null;
    accessTokenRef.current = null;
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue logout even if API fails
    }
    setUser(null);
    setAccessToken(null);
    clearAccessCookie();
    router.push("/login");
  }, [router]);

  useEffect(() => {
    async function init() {
      const token = await refreshAccessToken();
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
            accessTokenRef.current = token;
            setAccessCookie(token);
          }
        } catch {
          // Session expired
        }
      }
      setIsLoading(false);
    }
    init();
  }, [refreshAccessToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
