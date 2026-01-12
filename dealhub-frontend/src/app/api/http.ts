const TOKEN_KEY = "dealhub_token";

export const API_BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL ?? "http://localhost:8080";

export function resolveApiUrl(path: string): string {
  if (!path) return API_BASE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function setAuthToken(t: string | null) {
  const clean = t?.trim() || null;

  if (clean) localStorage.setItem(TOKEN_KEY, clean);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  const t = localStorage.getItem(TOKEN_KEY);
  const clean = t?.trim();
  return clean ? clean : null;
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
  const t = getAuthToken();

  return t ? { Authorization: `Bearer ${t}` } : {};
}

/**
 * JSON request/response
 */
export async function httpJson<T>(
  method: HttpMethod,
  url: string,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    ...authHeader(),
  };

  // Only set JSON content-type when sending a body
  const hasBody = body !== undefined && body !== null && method !== "GET";
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(resolveApiUrl(url), {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
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
