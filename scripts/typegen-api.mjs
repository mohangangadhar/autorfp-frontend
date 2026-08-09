#!/usr/bin/env node
/**
 * Typegen for the backend OpenAPI contract.
 *
 * Usage:
 *   npm run typegen:api                 # OPENAPI_URL, else ./openapi.json, else ./api-docs/openapi.json
 *   OPENAPI_URL=https://api.example.com/openapi.json npm run typegen:api
 *
 * Output: src/types/generated/api.ts (checked in when the contract is pinned).
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function resolveSpec() {
  if (process.env.OPENAPI_URL) return process.env.OPENAPI_URL;
  const candidates = [
    process.env.OPENAPI_PATH,
    path.join(root, "openapi.json"),
    path.join(root, "api-docs", "openapi.json"),
  ].filter(Boolean);
  const existing = candidates.find((candidate) => existsSync(candidate));
  return existing ?? null;
}

const spec = resolveSpec();

if (!spec) {
  console.warn(
    "typegen:api — no OpenAPI source found (set OPENAPI_URL/OPENAPI_PATH or drop openapi.json at repo root). Skipping.",
  );
  process.exit(0);
}

const outFile = path.join(root, "src", "types", "generated", "api.ts");
const args = ["openapi-typescript", spec, "--output", outFile, "--empty-objects-unknown"];

const result = spawnSync("npx", args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error("typegen:api failed:", result.error.message);
  process.exit(1);
}
process.exit(result.status ?? 1);