import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function parseApiPath(path: string) {
  const normalized = normalizePath(path);
  const [pathname, queryString] = normalized.split("?");

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  const segments = pathname.split("/").filter(Boolean);
  const functionName = segments[1];

  if (!functionName || functionName === "auth") {
    return null;
  }

  return {
    functionName,
    queryString,
  };
}

async function getAuthHeaders() {
  const supabase = getBrowserSupabaseClient();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const headers: HeadersInit = {
    apikey: anonKey,
    "Content-Type": "application/json",
  };

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  }

  return headers;
}

function getFunctionsBaseUrl() {
  const explicit = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1`;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const parsed = parseApiPath(path);

  if (parsed) {
    const headers = await getAuthHeaders();
    const baseUrl = getFunctionsBaseUrl();
    const url = `${baseUrl}/${parsed.functionName}${parsed.queryString ? `?${parsed.queryString}` : ""}`;

    const response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error || `Request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>("GET", path);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>("POST", path, body);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return request<T>("PUT", path, body);
}

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>("DELETE", path);
}