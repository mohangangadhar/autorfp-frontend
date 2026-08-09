import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { bffBootstrap, bffLogout } from "@/lib/auth/bff";
import { clearAccessToken, setAccessToken } from "@/lib/auth/token";
import { computeCapabilities, capabilitiesForRole, can } from "@/lib/rbac/can";
import type { Capability } from "@/lib/rbac/permissions";
import type { SessionPayload, UserProfile } from "@/types/api";

export const AUTH_ME_KEY = ["auth", "me"] as const;

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthContextValue {
  status: AuthStatus;
  user: UserProfile | null;
  capabilities: ReadonlySet<Capability>;
  can: (permission: Capability) => boolean;
  role: string | null;
  /** Seed the session from a successful login result (skips a bootstrap round-trip). */
  seedSession: (payload: SessionPayload) => void;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = React.useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return value;
}

function capabilitiesFromUser(user: UserProfile | null): ReadonlySet<Capability> {
  if (!user) return new Set();
  const extra = (user as UserProfile & { permissions?: string[] }).permissions;
  if (Array.isArray(extra)) return computeCapabilities(extra);
  return capabilitiesForRole(user.role);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: async () => {
      const payload = await bffBootstrap();
      setAccessToken(payload.access_token, payload.expires_in);
      return payload;
    },
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const status: AuthStatus = query.isPending
    ? "loading"
    : query.isError
      ? "unauthenticated"
      : "authenticated";

  const user = (query.data?.user ?? null) as UserProfile | null;
  const capabilities = React.useMemo(() => capabilitiesFromUser(user), [user]);
  const role = user?.role ?? null;

  const seedSession = React.useCallback(
    (payload: SessionPayload) => {
      setAccessToken(payload.access_token, payload.expires_in);
      queryClient.setQueryData(AUTH_ME_KEY, payload);
    },
    [queryClient],
  );

  const logout = React.useCallback(async () => {
    try {
      await bffLogout();
    } catch {
      // continue clearing local state regardless
    }
    clearAccessToken();
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  const canPermission = React.useCallback(
    (permission: Capability) => can(capabilities, permission),
    [capabilities],
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      capabilities,
      can: canPermission,
      role,
      seedSession,
      logout,
    }),
    [status, user, capabilities, canPermission, role, seedSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}