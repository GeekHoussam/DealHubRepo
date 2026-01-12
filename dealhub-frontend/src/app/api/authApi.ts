// src/app/api/authApi.ts
import { httpJson, setAuthToken } from "./http";
import type { LoginRequest, LoginResponse, MeResponse } from "./contracts";

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await httpJson<LoginResponse>("POST", "/auth/login", req);

  // ✅ supports both accessToken or token
  const t = (res as any)?.accessToken || (res as any)?.token;
  if (typeof t === "string" && t.trim().length) {
    setAuthToken(t);
  } else {
    // if backend didn't return a token, keep auth empty
    setAuthToken(null);
    throw new Error("Login response missing token");
  }

  return res;
}

export async function me(): Promise<MeResponse> {
  return httpJson<MeResponse>("GET", "/auth/me");
}

export async function logout() {
  setAuthToken(null);
}
