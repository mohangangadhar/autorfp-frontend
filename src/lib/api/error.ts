/**
 * AppError — single typed error model for every transport failure.
 *
 * Normalizers accept three backend shapes (error-handling-design.md §1):
 *   1. FastAPI  `{ detail: string }`
 *   2. FastAPI  `{ detail: { error_code, detail, errors? } }`
 *   3. RFC 9457 `{ type, title, status, detail, instance, errors[], trace_id }`
 */

export const APP_ERROR_CODES = [
  "VALIDATION",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "DEPENDENCY",
  "INTERNAL",
  "NETWORK",
  "TIMEOUT",
  "CANCELED",
] as const;

export type AppErrorCode = (typeof APP_ERROR_CODES)[number];

export interface FieldError {
  field: string;
  code?: string;
  message: string;
}

export interface AppErrorProps {
  code: AppErrorCode;
  httpStatus?: number;
  traceId?: string;
  fieldErrors?: FieldError[];
  userMessage: string;
  developerMessage?: string;
  retryable?: boolean;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly httpStatus?: number;
  readonly traceId?: string;
  readonly fieldErrors: FieldError[];
  readonly userMessage: string;
  readonly developerMessage?: string;
  readonly retryable: boolean;

  constructor(props: AppErrorProps) {
    super(props.userMessage);
    this.name = "AppError";
    this.code = props.code;
    this.httpStatus = props.httpStatus;
    this.traceId = props.traceId;
    this.fieldErrors = props.fieldErrors ?? [];
    this.userMessage = props.userMessage;
    this.developerMessage = props.developerMessage;
    this.retryable = props.retryable ?? false;
    if (props.cause !== undefined) this.cause = props.cause as Error;
  }

  get isValidation(): boolean {
    return this.code === "VALIDATION";
  }
}

const DEFAULT_MESSAGES: Record<AppErrorCode, string> = {
  VALIDATION: "Some fields need your attention.",
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to do this.",
  NOT_FOUND: "The requested resource was not found.",
  CONFLICT: "This change conflicts with current state.",
  RATE_LIMITED: "Too many attempts. Please wait and try again.",
  DEPENDENCY: "A downstream service is unavailable. Please try again later.",
  INTERNAL: "An unexpected error occurred. Please try again.",
  NETWORK: "Network error. Check your connection and try again.",
  TIMEOUT: "The request took too long. Please try again.",
  CANCELED: "Request canceled.",
};

function defaultMessage(code: AppErrorCode): string {
  return DEFAULT_MESSAGES[code];
}

/** HTTP status → AppError code table (frontend-api-contract.md §3). */
export function codeForStatus(status: number): AppErrorCode {
  switch (status) {
    case 400:
    case 422:
      return "VALIDATION";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 429:
      return "RATE_LIMITED";
    case 502:
    case 503:
    case 504:
      return "DEPENDENCY";
    default:
      return status >= 500 ? "INTERNAL" : "VALIDATION";
  }
}

type BodyRecord = Record<string, unknown>;

const NO_TRACE = undefined as string | undefined;

function readTraceId(body: BodyRecord): string | undefined {
  const raw = body["trace_id"] ?? body["trace"] ?? body["request_id"];
  return typeof raw === "string" && raw.length > 0 ? raw : NO_TRACE;
}

function readDetail(body: BodyRecord): unknown {
  return body["detail"];
}

/** Loc/field extraction shared by 422 detail[] and RFC errors[]. */
function toFieldError(loc: unknown, msg: unknown, code: unknown): FieldError | undefined {
  const field = Array.isArray(loc)
    ? loc
        .map(String)
        .filter((p) => p !== "body")
        .join(".")
    : typeof loc === "string"
      ? loc
      : undefined;
  if (field && typeof msg === "string") {
    return { field, code: typeof code === "string" ? code : undefined, message: msg };
  }
  return undefined;
}

function extractErrorArray(body: BodyRecord): FieldError[] | undefined {
  const errors = body["errors"];
  if (!Array.isArray(errors)) return undefined;
  const mapped = errors
    .map((raw) => {
      const entry = raw as BodyRecord;
      const loc = entry["field"] ?? entry["loc"];
      return toFieldError(loc, entry["message"] ?? entry["msg"], entry["code"]);
    })
    .filter((f): f is FieldError => Boolean(f));
  return mapped.length > 0 ? mapped : undefined;
}

function extractValidationDetail(body: BodyRecord): FieldError[] | undefined {
  const detail = readDetail(body);
  if (!Array.isArray(detail)) return undefined;
  const mapped = detail
    .map((raw) => {
      const entry = raw as BodyRecord;
      const loc = entry["loc"] ?? entry["field"];
      const msg = entry["msg"] ?? entry["message"];
      const code = entry["type"] ?? entry["code"];
      return toFieldError(loc, msg, code);
    })
    .filter((f): f is FieldError => Boolean(f));
  return mapped.length > 0 ? mapped : undefined;
}

function extractUserMessage(body: BodyRecord): string | undefined {
  const detail = readDetail(body);
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object") {
    const inner = detail as BodyRecord;
    const innerDetail = inner["detail"];
    if (typeof innerDetail === "string") return innerDetail;
  }
  const title = body["title"];
  if (typeof title === "string") return title;
  return undefined;
}

function extractDeveloperMessage(body: BodyRecord): string | undefined {
  const detail = readDetail(body);
  if (detail && typeof detail === "object") {
    const inner = detail as BodyRecord;
    const err = inner["error_code"];
    if (typeof err === "string") return err;
  }
  const err = body["error"];
  if (typeof err === "string") return err;
  return undefined;
}

/** Map an HTTP response (status + parsed body) to a typed `AppError`. */
export function normalizeHttpError(status: number, body: unknown): AppError {
  const code = codeForStatus(status);
  const record = (body ?? {}) as BodyRecord;

  const fieldErrors = extractErrorArray(record) ?? extractValidationDetail(record);
  const userMessage = extractUserMessage(record) ?? defaultMessage(code);

  return new AppError({
    code,
    httpStatus: status,
    traceId: readTraceId(record),
    fieldErrors,
    userMessage,
    developerMessage: extractDeveloperMessage(record),
    retryable: [429, 502, 503, 504].includes(status),
  });
}

/**
 * Normalize any error into `AppError`.
 * - `AppError` passes through unchanged
 * - abort → CANCELED
 * - fetch `TypeError` (network) → NETWORK
 * - anything else → INTERNAL
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof DOMException && error.name === "AbortError") {
    return new AppError({ code: "CANCELED", userMessage: defaultMessage("CANCELED") });
  }

  if (error instanceof TypeError) {
    return new AppError({
      code: "NETWORK",
      userMessage: defaultMessage("NETWORK"),
      retryable: true,
      cause: error,
    });
  }

  const fallback = error instanceof Error ? error.message : "Unknown error";
  return new AppError({
    code: "INTERNAL",
    userMessage: defaultMessage("INTERNAL"),
    developerMessage: fallback,
    cause: error instanceof Error ? error : undefined,
  });
}