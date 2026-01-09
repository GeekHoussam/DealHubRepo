// src/app/api/authApi.ts
import { httpJson, setAuthToken } from "./http";
import type { LoginRequest, LoginResponse, MeResponse } from "./contracts";

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await httpJson<LoginResponse>("POST", "/auth/login", req);

  // supports accessToken or token
  const t = (res as any).accessToken || (res as any).token;
  if (typeof t === "string" && t.length) setAuthToken(t);

  return res;
}

export async function me(): Promise<MeResponse> {
  return httpJson<MeResponse>("GET", "/auth/me");
}

export async function logout() {
  setAuthToken(null);
}
