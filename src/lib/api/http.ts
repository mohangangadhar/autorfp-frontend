import { apiOrigin } from "@/config/env";
import { generateCorrelationId, newEntityId } from "@/lib/api/ids";
import { normalizeHttpError, toAppError } from "@/lib/api/error";

export type HttpClientMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpClientOptions extends Omit<RequestInit, "method" | "body"> {
  method?: HttpClientMethod;
  body?: unknown;
  /** Milliseconds before abort. Default 30s. */
  timeoutMs?: number;
  /** Add `X-Correlation-ID` (default true). */
  withCorrelationId?: boolean;
  /** Add a fresh `X-Request-Id` (default true). */
  withRequestId?: boolean;
  /** Skip the `Authorization` header and 401-refresh for public endpoints. */
  public?: boolean;
  /** Skip the automatic single-flight 401 → refresh → retry. */
  skipAuthRefresh?: boolean;
}

export interface HttpDeps {
  /** Current in-memory access token (null when absent). */
  getAccessToken: () => string | null;
  /** Session rotation via the BFF refresh route; single-flight by caller. */
  refreshToken: () => Promise<boolean>;
  /** Called when refresh fails and the session must end. */
  onUnauthorized: () => void;
  /** Override the fetch implementation (tests). */
  fetchImpl?: typeof fetch;
  /** Base origin for requests; defaults to the public API origin. */
  baseUrl?: string;
}

export interface HttpResult<T> {
  status: number;
  headers: Headers;
  data: T;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const RETRYABLE_STATUS = new Set([429, 503]);
const MAX_RETRIES = 2;

function backoffDelay(attempt: number): number {
  // 500 → 1000 → 2000ms capped at 10s
  return Math.min(500 * 2 ** attempt, 10_000);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Low-level transport. Handles correlation/request ids, authorization,
 * timeouts, retry/backoff for safe methods, refresh-on-401, and error
 * normalization. Knows nothing about AUTORFP domain terms.
 */
export function createHttpClient(deps: HttpDeps) {
  const fetchActual: typeof fetch = deps.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const baseUrl = (deps.baseUrl ?? apiOrigin()).replace(/\/+$/, "");

  async function request<T>(path: string, options: HttpClientOptions = {}): Promise<HttpResult<T>> {
    const method = (options.method ?? "GET") as HttpClientMethod;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const headers: Record<string, string> = { accept: "application/json" };

    let body: BodyInit | undefined;
    if (options.body !== undefined) {
      if (typeof options.body === "string") {
        body = options.body;
      } else if (isFormDataLike(options.body)) {
        body = options.body as FormData;
      } else {
        headers["content-type"] = "application/json";
        body = JSON.stringify(options.body);
      }
    }

    if (options.withCorrelationId !== false) {
      headers["x-correlation-id"] = generateCorrelationId();
    }
    if (options.withRequestId !== false) {
      headers["x-request-id"] = newEntityId();
    }

    if (!options.public && !options.skipAuthRefresh) {
      const accessToken = deps.getAccessToken();
      if (accessToken) headers["authorization"] = `Bearer ${accessToken}`;
    }

    const doSend = (): Promise<HttpResult<unknown>> =>
      sendOnce(path, { timeoutMs, headers, method, body, signal: options.signal });

    let result = await doSend();

    // Retry safe methods on transient statuses with backoff.
    if (isIdempotent(method)) {
      let attempt = 0;
      while (RETRYABLE_STATUS.has(result.status) && attempt < MAX_RETRIES) {
        await sleep(backoffDelay(attempt));
        result = await doSend();
        attempt++;
      }
    }

    // Refresh once on 401 (single-flight in the caller), then replay.
    if (result.status === 401 && !options.public && !options.skipAuthRefresh) {
      const refreshed = await deps.refreshToken();
      if (refreshed) {
        const token = deps.getAccessToken();
        if (token) headers["authorization"] = `Bearer ${token}`;
        result = await doSend();
      } else {
        deps.onUnauthorized();
      }
    }

    if (result.status < 200 || result.status >= 300) {
      throw normalizeHttpError(result.status, result.data);
    }

    return result as HttpResult<T>;
  }

  /** Single attempt — combined timeout + parse + error normalization. */
  async function sendOnce(
    path: string,
    cfg: {
      timeoutMs: number;
      headers: Record<string, string>;
      method: HttpClientMethod;
      body?: BodyInit;
      signal?: AbortSignal | null;
    },
  ): Promise<HttpResult<unknown>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), cfg.timeoutMs);

    const onParentAbort = () => {
      if (cfg.signal?.aborted) controller.abort();
    };
    cfg.signal?.addEventListener("abort", onParentAbort, { once: true });

    let response: Response;
    try {
      response = await fetchActual(new URL(path.replace(/^\/+/, ""), `${baseUrl}/`), {
        method: cfg.method,
        headers: cfg.headers,
        body: cfg.body as BodyInit | undefined,
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
      });
    } catch (cause) {
      throw toAppError(cause);
    } finally {
      clearTimeout(timeoutId);
      cfg.signal?.removeEventListener("abort", onParentAbort);
    }

    const data = await readBody(response);
    return { status: response.status, headers: response.headers, data };
  }

  /** 204 → undefined; JSON content-type → parsed; otherwise raw text. */
  async function readBody(response: Response): Promise<unknown> {
    if (response.status === 204) return undefined;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        return await response.json();
      } catch {
        return undefined;
      }
    }
    return response.text();
  }

  return {
    request,
    get: <T>(path: string, options?: HttpClientOptions) => request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, body?: unknown, options?: HttpClientOptions) =>
      request<T>(path, { ...options, method: "POST", body }),
    put: <T>(path: string, body?: unknown, options?: HttpClientOptions) =>
      request<T>(path, { ...options, method: "PUT", body }),
    patch: <T>(path: string, body?: unknown, options?: HttpClientOptions) =>
      request<T>(path, { ...options, method: "PATCH", body }),
    delete: <T>(path: string, options?: HttpClientOptions) =>
      request<T>(path, { ...options, method: "DELETE" }),
  };
}

function isIdempotent(method: HttpClientMethod): boolean {
  return method === "GET";
}

function isFormDataLike(value: unknown): boolean {
  return typeof FormData !== "undefined" && value instanceof FormData;
}