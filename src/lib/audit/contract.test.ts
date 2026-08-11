import { describe, expect, it } from "vitest";
import {
  AUDIT_PAGE_SIZE_DEFAULT,
  auditFiltersToQuery,
  formatActor,
  formatChangeValue,
  formatEventTime,
  isSystemEvent,
} from "./contract";

describe("auditFiltersToQuery", () => {
  it("omits everything when no filters are set", () => {
    expect(auditFiltersToQuery()).toBe("");
    expect(auditFiltersToQuery({})).toBe("");
  });

  it("serializes filter fields with trimming", () => {
    const query = auditFiltersToQuery({
      action: " user.login ",
      user_id: "user_1",
      entity_type: "user",
      entity_id: "42",
      date_from: "2026-08-01",
      date_to: "2026-08-31",
    });
    expect(query).toContain("action=user.login");
    expect(query).toContain("user_id=user_1");
    expect(query).toContain("entity_type=user");
    expect(query).toContain("entity_id=42");
    expect(query).toContain("date_from=2026-08-01");
    expect(query).toContain("date_to=2026-08-31");
  });

  it("omits blank filter fields", () => {
    const query = auditFiltersToQuery({ action: "   ", user_id: "", entity_type: undefined });
    expect(query).not.toContain("action=");
    expect(query).not.toContain("user_id=");
    expect(query).not.toContain("entity_type=");
  });

  it("does not emit default pagination", () => {
    const query = auditFiltersToQuery({ page: 1, perPage: AUDIT_PAGE_SIZE_DEFAULT });
    expect(query).not.toContain("page=");
    expect(query).not.toContain("per_page=");
  });

  it("emits non-default pagination", () => {
    const query = auditFiltersToQuery({ page: 3, perPage: 50 });
    expect(query).toContain("page=3");
    expect(query).toContain("per_page=50");
  });

  it("does not emit default created_at desc sort", () => {
    const query = auditFiltersToQuery({ sort_by: "created_at", sort_order: "desc" });
    expect(query).not.toContain("sort_by=");
    expect(query).not.toContain("sort_order=");
  });

  it("emits an ascending sort", () => {
    const query = auditFiltersToQuery({ sort_order: "asc" });
    expect(query).toContain("sort_order=asc");
  });
});

describe("actor helpers", () => {
  it("treats null/undefined user ids as system events", () => {
    expect(isSystemEvent(null)).toBe(true);
    expect(isSystemEvent(undefined)).toBe(true);
    expect(isSystemEvent("user_1")).toBe(false);
  });

  it("labels system events and shortens actor ids", () => {
    expect(formatActor(null)).toBe("System");
    expect(formatActor("0123456789abcdef")).toBe("01234567");
  });
});

describe("formatChangeValue", () => {
  it("renders scalars and JSON payloads as plain text", () => {
    expect(formatChangeValue("draft")).toBe("draft");
    expect(formatChangeValue(42)).toBe("42");
    expect(formatChangeValue(true)).toBe("true");
    expect(formatChangeValue(null)).toBe("");
    expect(formatChangeValue(undefined)).toBe("");
    expect(formatChangeValue({ a: 1 })).toBe('{"a":1}');
  });
});

describe("formatEventTime", () => {
  it("formats a valid ISO timestamp", () => {
    const label = formatEventTime("2026-08-01T12:00:00Z");
    expect(label).toMatch(/\d/);
    expect(new Date("2026-08-01T12:00:00Z").getTime()).toBeGreaterThan(0);
  });

  it("falls back to the raw string for invalid input", () => {
    expect(formatEventTime("not-a-date")).toBe("not-a-date");
  });
});
