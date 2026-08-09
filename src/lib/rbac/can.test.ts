import { describe, it, expect } from "vitest";
import { can, canAny, capabilitiesForRole, computeCapabilities, roleHint } from "@/lib/rbac/can";
import { isCapability, type Capability } from "@/lib/rbac/permissions";

describe("isCapability", () => {
  it("accepts known constants and rejects junk", () => {
    expect(isCapability("document.read")).toBe(true);
    expect(isCapability("document.write")).toBe(true);
    expect(isCapability("nonsense")).toBe(false);
  });
});

describe("computeCapabilities", () => {
  it("carries unknown future constants intact", () => {
    const caps = computeCapabilities(["document.read", "future.x"]);
    expect(caps.has("document.read")).toBe(true);
    expect(caps.has("future.x" as Capability)).toBe(true);
  });
});

describe("capabilitiesForRole", () => {
  it("maps org_admin to full set", () => {
    const caps = capabilitiesForRole("org_admin");
    expect(caps.has("admin.write")).toBe(true);
    expect(caps.has("document.write")).toBe(true);
  });

  it("maps viewer to read-only set (no write caps)", () => {
    const caps = capabilitiesForRole("viewer");
    expect(caps.has("document.read")).toBe(true);
    expect(caps.has("document.write")).toBe(false);
  });

  it("returns empty set for unknown roles", () => {
    expect(capabilitiesForRole("ghost").size).toBe(0);
  });
});

describe("can / canAny", () => {
  const caps = capabilitiesForRole("editor");

  it("checks membership", () => {
    expect(can(caps, "document.read")).toBe(true);
    expect(can(caps, "document.write")).toBe(true);
    expect(can(caps, "admin.write")).toBe(false);
  });

  it("canAny is true when at least one permission matches", () => {
    expect(canAny(caps, ["admin.write", "document.read"])).toBe(true);
    expect(canAny(caps, ["admin.write", "admin.role"])).toBe(false);
  });
});

describe("roleHint", () => {
  it("prioritizes admin", () => {
    expect(roleHint(capabilitiesForRole("org_admin"))).toBe("admin");
  });
  it("detects approver over reviewer", () => {
    expect(roleHint(capabilitiesForRole("approver"))).toBe("approver");
  });
  it("detects reviewer", () => {
    expect(roleHint(capabilitiesForRole("reviewer"))).toBe("reviewer");
  });
  it("detects editor via write cap", () => {
    expect(roleHint(capabilitiesForRole("editor"))).toBe("editor");
  });
  it("falls back to viewer", () => {
    expect(roleHint(capabilitiesForRole("viewer"))).toBe("viewer");
  });
});