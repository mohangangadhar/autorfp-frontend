import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { AppError } from "@/lib/api/error";
import { applyServerErrors } from "./server-errors";

interface FormValues {
  name: string;
  admin: { email: string };
}

describe("applyServerErrors", () => {
  it("maps RFC 9457 field errors onto known form paths", () => {
    const { result } = renderHook(() => useForm<FormValues>({ defaultValues: { name: "", admin: { email: "" } } }));

    const error = new AppError({
      code: "VALIDATION",
      httpStatus: 422,
      userMessage: "Validation failed",
      fieldErrors: [{ field: "name", message: "Already taken." }],
    });

    act(() => {
      expect(applyServerErrors(result.current, error)).toBe(true);
    });

    expect(result.current.getFieldState("name").error?.message).toBe("Already taken.");
  });

  it("leaves the form untouched for network-level failures", () => {
    const { result } = renderHook(() => useForm<FormValues>({ defaultValues: { name: "", admin: { email: "" } } }));

    const error = new AppError({ code: "NETWORK", userMessage: "Offline" });

    act(() => {
      expect(applyServerErrors(result.current, error)).toBe(false);
    });

    expect(result.current.formState.errors.name).toBeUndefined();
  });

  it("ignores unknown paths instead of crashing", () => {
    const { result } = renderHook(() => useForm<FormValues>({ defaultValues: { name: "", admin: { email: "" } } }));

    const error = new AppError({
      code: "VALIDATION",
      httpStatus: 400,
      userMessage: "Bad request",
      fieldErrors: [{ field: "config.branding.logo_url", message: "Invalid." }],
    });

    expect(() =>
      act(() => {
        applyServerErrors(result.current, error);
      }),
    ).not.toThrow();
  });
});