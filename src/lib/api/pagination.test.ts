import { describe, it, expect } from "vitest";
import {
  normalizePaginated,
  pageParamsFromQuery,
  pageParamsToQuery,
  PAGE_SIZE_DEFAULT,
} from "@/lib/api/pagination";

describe("normalizePaginated", () => {
  it("normalizes offset payloads", () => {
    const result = normalizePaginated<{ id: number }>({
      items: [{ id: 1 }],
      total: 41,
      page: 3,
      per_page: 20,
      total_pages: 3,
    });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(41);
    expect(result.page).toBe(3);
    expect(result.perPage).toBe(20);
    expect(result.totalPages).toBe(3);
  });

  it("computes totalPages for bare {items,total}", () => {
    const result = normalizePaginated<number>({ items: [1, 2], total: 25 });
    expect(result.perPage).toBe(PAGE_SIZE_DEFAULT);
    expect(result.totalPages).toBe(2);
    expect(result.page).toBe(1);
  });

  it("returns an empty page for non-objects", () => {
    const result = normalizePaginated<number>(null);
    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("clamps malformed numbers", () => {
    const result = normalizePaginated<number>({ items: [], total: "nope", per_page: -5 });
    expect(result.total).toBe(0);
    expect(result.perPage).toBe(PAGE_SIZE_DEFAULT);
  });
});

describe("pageParams helpers", () => {
  it("omits defaults from the query", () => {
    expect(pageParamsToQuery({})).toBe("");
    expect(pageParamsToQuery({ page: 2 })).toBe("page=2");
    expect(pageParamsToQuery({ perPage: 50 })).toBe("per_page=50");
  });

  it("parses and clamps query params", () => {
    const params = pageParamsFromQuery(new URLSearchParams("page=0&per_page=999"));
    expect(params.page).toBe(1);
    expect(params.perPage).toBe(100);
  });
});