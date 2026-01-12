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

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function authHeader(): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function safeReadText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function looksLikeJson(s: string) {
  const t = (s ?? "").trim();
  return t.startsWith("{") || t.startsWith("[");
}

function mapStatusToMessage(
  status: number,
  serverMessage?: string,
  code?: string
) {
  const c = (code ?? "").toUpperCase();

  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403) {
    if (c.includes("BAD_CREDENTIALS") || c.includes("INVALID_CREDENTIALS")) {
      return "You don’t have access to this action.";
    }
    return "Email or password is incorrect.";
  }
  if (status === 404)
    return "Service not found. Please check the gateway routes.";
  if (status === 409)
    return serverMessage || "Conflict. Please refresh and try again.";
  if (status >= 500) return "Server error. Please try again in a moment.";

  // fallback
  return serverMessage || `Request failed (HTTP ${status}).`;
}

async function handleResponse(res: Response) {
  if (res.ok) return res;

  const bodyText = await safeReadText(res);

  let serverMessage: string | undefined;
  let serverCode: string | undefined;
  let details: any = undefined;

  if (bodyText && looksLikeJson(bodyText)) {
    try {
      const json = JSON.parse(bodyText);
      details = json;

      serverMessage =
        json?.message ??
        json?.error_description ??
        json?.errorMessage ??
        json?.error ??
        undefined;

      serverCode = json?.code ?? json?.error ?? json?.status ?? undefined;
    } catch {}
  } else if (bodyText) {
    serverMessage = bodyText;
  }

  if (res.status === 401) {
    setAuthToken(null);
  }

  const friendly = mapStatusToMessage(res.status, serverMessage, serverCode);

  throw new ApiError(friendly, res.status, serverCode, details);
}

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

  const text = await safeReadText(res);
  return (text ? JSON.parse(text) : null) as T;
}

export async function httpForm<T>(url: string, form: FormData): Promise<T> {
  const res = await fetch(resolveApiUrl(url), {
    method: "POST",
    headers: {
      ...authHeader(),
    },
    body: form,
  });

  await handleResponse(res);

  const text = await safeReadText(res);
  return (text ? JSON.parse(text) : null) as T;
}

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
