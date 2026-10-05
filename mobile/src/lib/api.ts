import { config } from "./config";

/** Header the cart API uses to tag a change with the device that made it (see the website's cart-types.ts). */
export const CART_ORIGIN_HEADER = "x-cart-origin";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Set by the AuthProvider so every request carries the signed-in user's bearer token. */
export function setAuthToken(token: string | null) {
  authToken = token;
}
export const getAuthToken = () => authToken;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Options = { method?: string; body?: unknown; headers?: Record<string, string> };

/** JSON request to the website's API. Throws ApiError with the server's message on failure. */
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json", ...opts.headers };
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  if (authToken) headers.authorization = `Bearer ${authToken}`;

  let res: Response;
  try {
    res = await fetch(`${config.apiUrl}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError("Can't reach Snoware right now. Check your connection and try again.", 0, null);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // A rejected token means the session is over (expired or signed out elsewhere).
    if (res.status === 401 && authToken) onUnauthorized?.();
    const message = (data && (data.error || data.message)) || "Something went wrong. Please try again.";
    throw new ApiError(message, res.status, data);
  }
  return data as T;
}
