import { describe, it, expect } from "vitest";
import { codeForStatus, normalizeHttpError, toAppError } from "@/lib/api/error";

describe("codeForStatus", () => {
  it("maps validation statuses", () => {
    expect(codeForStatus(400)).toBe("VALIDATION");
    expect(codeForStatus(422)).toBe("VALIDATION");
  });
  it("maps auth statuses", () => {
    expect(codeForStatus(401)).toBe("UNAUTHORIZED");
    expect(codeForStatus(403)).toBe("FORBIDDEN");
  });
  it("maps availability statuses", () => {
    expect(codeForStatus(429)).toBe("RATE_LIMITED");
    expect(codeForStatus(503)).toBe("DEPENDENCY");
    expect(codeForStatus(500)).toBe("INTERNAL");
  });
});

describe("normalizeHttpError", () => {
  it("reads FastAPI `{detail}` string messages", () => {
    const error = normalizeHttpError(401, { detail: "Invalid email or password." });
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.userMessage).toBe("Invalid email or password.");
    expect(error.httpStatus).toBe(401);
  });

  it("reads nested `{detail:{error_code,detail}}` shapes", () => {
    const error = normalizeHttpError(403, {
      detail: { error_code: "FORBIDDEN_ROLE", detail: "This role cannot do that." },
    });
    expect(error.code).toBe("FORBIDDEN");
    expect(error.userMessage).toBe("This role cannot do that.");
    expect(error.developerMessage).toBe("FORBIDDEN_ROLE");
  });

  it("extracts field errors from RFC 9457 errors[]", () => {
    const error = normalizeHttpError(422, {
      detail: "Validation failed",
      errors: [{ field: "email", code: "invalid_email", message: "Not a valid email" }],
      trace_id: "corr_abc",
    });
    expect(error.isValidation).toBe(true);
    expect(error.fieldErrors).toHaveLength(1);
    expect(error.fieldErrors[0]?.field).toBe("email");
    expect(error.traceId).toBe("corr_abc");
  });

  it("extracts loc-based field errors from FastAPI detail[]", () => {
    const error = normalizeHttpError(422, {
      detail: [
        { loc: ["body", "password"], msg: "String should have at least 8 characters", type: "string_too_short" },
      ],
    });
    expect(error.fieldErrors[0]?.field).toBe("password");
    expect(error.retryable).toBe(false);
  });

  it("marks retryable statuses", () => {
    expect(normalizeHttpError(503, {}).retryable).toBe(true);
    expect(normalizeHttpError(400, {}).retryable).toBe(false);
  });
});

describe("toAppError", () => {
  it("passes through AppError unchanged", () => {
    const original = normalizeHttpError(401, {});
    expect(toAppError(original)).toBe(original);
  });

  it("maps AbortError to CANCELED", () => {
    const error = toAppError(new DOMException("aborted", "AbortError"));
    expect(error.code).toBe("CANCELED");
  });

  it("maps TypeError to NETWORK", () => {
    const error = toAppError(new TypeError("fetch failed"));
    expect(error.code).toBe("NETWORK");
    expect(error.retryable).toBe(true);
  });

  it("falls back to INTERNAL", () => {
    const error = toAppError(new Error("boom"));
    expect(error.code).toBe("INTERNAL");
    expect(error.developerMessage).toBe("boom");
  });
});