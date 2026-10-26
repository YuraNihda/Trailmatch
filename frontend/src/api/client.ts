import { ApiError } from "./errors";
import { tokenStore } from "./token";

const BASE: string = import.meta.env.VITE_API_BASE ?? "/api/v1";
export const AUTH_EXPIRED_EVENT = "tm:auth-expired";

type Query = Record<string, string | number | boolean | undefined | null>;
interface Opts { method?: "GET" | "POST" | "PATCH"; body?: unknown; query?: Query }

export async function request<T>(path: string, { method = "GET", body, query }: Opts = {}): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  const url = `${BASE}${path}${qs.toString() ? `?${qs.toString()}` : ""}`;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "network_error", "Network error");
  }

  if (res.ok) return (res.status === 204 ? undefined : await res.json()) as T;

  if (res.status === 401 && token) {
    tokenStore.clear();
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
  let code = "internal_error";
  let message = "Request failed";
  try {
    const data = await res.json();
    if (data?.error) { code = data.error.code; message = data.error.message; }
    else if (res.status === 422) { code = "validation_error"; message = "Validation error"; }
  } catch { /* non-JSON error body */ }
  throw new ApiError(res.status, code, message);
}
