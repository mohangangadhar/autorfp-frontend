# AUTORFP Frontend

Automated RFP response generation platform — **frontend foundation** (Next.js App Router + React 19 + TypeScript strict).

## Stack

- **Next.js 16** (App Router, `output: standalone`) — server components, route handlers, and the session **proxy** (`src/proxy.ts`, the Next 16 middleware successor)
- **React 19** + **TypeScript strict** (`noUncheckedIndexedAccess`, no `any`)
- **Tailwind CSS v4** with semantic design tokens (`src/app/globals.css`)
- **TanStack Query** + **Zustand** (server state / UI state)
- **react-hook-form** + **zod** for typed forms
- **Radix UI** primitives + **lucide-react** icons
- **Vitest + Testing Library** (unit) and **Playwright** (E2E)
- **Sentry** (instrumented via `src/instrumentation.ts`)

## Getting started

```bash
npm ci
cp .env.example .env.local   # then adjust values
npm run dev                  # http://localhost:3000
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm run start` | Production build / serve standalone |
| `npm run lint` | ESLint (Next + TS) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` / `test:coverage` | Vitest unit tests |
| `npm run e2e` / `e2e:smoke` | Playwright end-to-end |
| `npm run typegen:api` | Generate `src/types/generated/api.ts` from OpenAPI |

## Architecture notes

- **BFF auth relay**: the browser only talks to same-origin Next route handlers (`src/app/api/auth/*`). Access tokens live in client memory; the refresh token is an httpOnly `__session` cookie. Session rotation is single-flight (`src/lib/api/refresh.ts`).
- **RBAC**: `Capability` constants mirror the backend matrix (`src/lib/rbac`). The backend is the enforcement authority; UI gating is a mirror.
- **Error model**: every transport failure normalizes to `AppError` (`src/lib/api/error.ts`), supporting FastAPI and RFC 9457 shapes.
- **i18n**: all shell strings live in `src/lib/i18n/messages.ts` (typed catalog, `t()` lookup).

## Layout

```
src/
  app/            # routes: (auth), (app) module pages, api/* BFF relays
  components/     # ui primitives, shell, auth, core, shared, rbac
  lib/            # api, auth, rbac, i18n, nav, state, theme, utils
  config/         # env contracts (env.ts client / env-server.ts server-only)
  types/          # DTO types + generated OpenAPI types
  proxy.ts        # session presence gate (Next 16 proxy)
  instrumentation.ts
e2e/              # Playwright specs
scripts/          # typegen + tooling
```

## Environment

See `.env.example`. Server-only variables (`BACKEND_API_URL`, `SESSION_COOKIE_NAME`, …) are never exposed to the browser; `NEXT_PUBLIC_*` are inlined client-side.
