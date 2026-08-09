import { describe, it, expect, vi, afterEach } from "vitest";
import { t, hasMessageKey } from "@/lib/i18n/index";
import { messages, isMessageKey } from "@/lib/i18n/messages";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("t()", () => {
  it("resolves nested keys", () => {
    expect(t("app.name")).toBe("AUTORFP");
    expect(t("nav.risk")).toBe("Risk");
  });

  it("interpolates placeholders", () => {
    expect(t("nav.requirements", { count: 3 })).toContain("Requirements");
  });

  it("returns the key marker for unknown keys outside development", () => {
    expect(t("missing.thing")).toBe("[missing.thing]");
  });

  it("throws on unknown keys in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(() => t("missing.thing")).toThrow();
  });
});

describe("catalog helpers", () => {
  it("hasMessageKey", () => {
    expect(hasMessageKey("common.save")).toBe(true);
    expect(hasMessageKey("common.missing")).toBe(false);
  });

  it("isMessageKey", () => {
    expect(isMessageKey("auth.loginTitle")).toBe(true);
    expect(isMessageKey(42)).toBe(false);
    expect(isMessageKey("unknown.x")).toBe(false);
  });

  it("messages catalog contains the pages namespace", () => {
    expect(messages.en.pages.dashboard.title).toBe("Dashboard");
  });
});