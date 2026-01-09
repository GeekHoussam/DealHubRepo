// src/app/api/http.ts

let token: string | null = localStorage.getItem("dealhub_token");

export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8080";

/**
 * Resolve an API path to an absolute URL
 */
export function resolveApiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function setAuthToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("dealhub_token", t);
  else localStorage.removeItem("dealhub_token");
}

export function getAuthToken() {
  return token;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function handleResponse(res: Response) {
  if (res.status === 401) {
    setAuthToken(null);
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res;
}

function authHeader(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * JSON request/response
 */
export async function httpJson<T>(
  method: HttpMethod,
  url: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(resolveApiUrl(url), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  await handleResponse(res);

  // Some endpoints return empty body
  const text = await res.text().catch(() => "");
  return (text ? JSON.parse(text) : null) as T;
}

/**
 * Multipart/FormData POST
 */
export async function httpForm<T>(url: string, form: FormData): Promise<T> {
  const res = await fetch(resolveApiUrl(url), {
    method: "POST",
    headers: {
      ...authHeader(),
      // DO NOT set Content-Type for FormData
    },
    body: form,
  });

  await handleResponse(res);

  const text = await res.text().catch(() => "");
  return (text ? JSON.parse(text) : null) as T;
}

/**
 * Download as Blob
 */
export async function httpBlob(url: string): Promise<Blob> {
  const res = await fetch(resolveApiUrl(url), {
    method: "GET",
    headers: {
      ...authHeader(),
    },
  });

  await handleResponse(res);
  return await res.blob();
}
