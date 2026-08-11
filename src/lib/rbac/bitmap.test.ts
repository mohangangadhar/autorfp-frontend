import { describe, expect, it } from "vitest";
import {
  PERMISSION_BITS,
  PERMISSION_GROUPS,
  PERMISSION_NAMES,
  bitmapToNames,
  hasPermission,
  namesToBitmap,
  type PermissionBitName,
} from "./bitmap";

describe("bitmap helpers (backend mirror)", () => {
  it("mirrors the 22 backend bit positions 0..21", () => {
    const all = Object.values(PERMISSION_BITS);
    expect(all).toHaveLength(22);
    expect(new Set(all).size).toBe(22);
    expect(PERMISSION_BITS.QUALIFICATION_WRITE).toBe(1 << 21);
    expect(Math.max(...all)).toBe(1 << 21);
  });

  it("names every bit position (canonical colon names)", () => {
    for (const name of Object.keys(PERMISSION_BITS) as PermissionBitName[]) {
      expect(PERMISSION_NAMES[name]).toMatch(/^[a-z]+:[a-z]+$/);
    }
    expect(PERMISSION_NAMES.DOCUMENT_READ).toBe("document:read");
    expect(PERMISSION_NAMES.QUALIFICATION_WRITE).toBe("qualification:write");
  });

  it("PERMISSION_GROUPS covers every bit exactly once", () => {
    const all = new Set(Object.keys(PERMISSION_BITS) as PermissionBitName[]);
    const covered = new Set(PERMISSION_GROUPS.flatMap((group) => group.permissions));
    expect(covered).toEqual(all);
  });

  it("hasPermission reads individual bits", () => {
    const bitmap = PERMISSION_BITS.DOCUMENT_READ | PERMISSION_BITS.USER_WRITE;
    expect(hasPermission(bitmap, "DOCUMENT_READ")).toBe(true);
    expect(hasPermission(bitmap, "USER_WRITE")).toBe(true);
    expect(hasPermission(bitmap, "AUDIT_READ")).toBe(false);
  });

  it("bitmapToNames returns the exact set of set bits", () => {
    const bitmap = PERMISSION_BITS.DOCUMENT_READ | PERMISSION_BITS.QUALIFICATION_WRITE;
    expect(bitmapToNames(bitmap)).toEqual(
      new Set(["DOCUMENT_READ", "QUALIFICATION_WRITE"] as PermissionBitName[]),
    );
    expect(bitmapToNames(0).size).toBe(0);
  });

  it("namesToBitmap ORs names into a bitmap (empty → 0)", () => {
    expect(namesToBitmap(["DOCUMENT_READ", "DOCUMENT_READ", "ORG_DELETE"])).toBe(
      PERMISSION_BITS.DOCUMENT_READ | PERMISSION_BITS.ORG_DELETE,
    );
    expect(namesToBitmap(new Set<PermissionBitName>())).toBe(0);
  });

  it("round-trips a full bitmap through names (all 22 bits set)", () => {
    const all = Object.keys(PERMISSION_BITS) as PermissionBitName[];
    const full = namesToBitmap(all);
    expect(full).toBe((1 << 22) - 1);
    expect(bitmapToNames(full).size).toBe(22);
    expect(namesToBitmap(bitmapToNames(full))).toBe(full);
  });
});
