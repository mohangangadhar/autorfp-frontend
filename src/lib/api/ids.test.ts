import { describe, it, expect } from "vitest";
import { generateCorrelationId, ulid } from "@/lib/api/ids";

describe("ulid", () => {
  it("is 26 characters and monotic timestamp prefix", () => {
    const now = 1_700_000_000_000;
    const id = ulid(now, () => 1);
    expect(id).toHaveLength(26);
    expect(id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
  });

  it("sorts by time (time prefix increases)", () => {
    const early = ulid(1_000, () => 0);
    const late = ulid(10_000, () => 0);
    expect(early < late).toBe(true);
  });
});

describe("generateCorrelationId", () => {
  it("is prefixed with corr_", () => {
    expect(generateCorrelationId(() => 0)).toMatch(/^corr_[0-9A-HJKMNP-TV-Z]{26}$/);
  });
});