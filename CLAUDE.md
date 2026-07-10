# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CC 生鮮 (CC Fresh) — a single-page frozen-food ordering site. Next.js 16 (App Router) + React 19 + Tailwind CSS v4, backed by Neon serverless Postgres. UI copy and inline comments are in Traditional Chinese.

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npm run test:e2e` — Playwright e2e (`e2e/`, projects: ios / android / desktop). Tests place REAL orders through the dev server into the `.env.local` `DATABASE_URL`. A global-setup guard (`e2e/global-setup.ts`) refuses to run unless the DB host is in its `ALLOWED_TEST_DB_HOSTS` allowlist — add the new host there when the test database changes. There is no row cleanup.

## Environment

Copy `.env.example` → `.env.local` and fill in:
- `DATABASE_URL` — Neon Postgres connection string (use the pooled connection)
- `ADMIN_SECRET_TOKEN` — Bearer token guarding `POST /api/revalidate`
- `AUTH_SECRET` — reserved for NextAuth (not yet wired up)

The DB schema is not in this repo; tables referenced: `products`, `categories`, `pickup_spots`, `orders`, `order_items`.

## Architecture

Data flows DB → server data layer → API route → client. There is no server-rendered product data; `app/page.tsx` renders the client `<App/>`, which fetches everything over `/api/*`.

**Data layer (`app/lib/`)** — server-only modules wrapping SQL:
- `db.ts` — single `sql` export (Neon HTTP driver). Always query via its tagged-template form so values are parameterized.
- `products.ts`, `categories.ts`, `pickup-spots.ts` — each exports a read function wrapped in `unstable_cache` with a cache tag (`"products"`, `"categories"`, `"pickup-spots"`). Results are cached until the tag is revalidated.
- `orders.ts` — `createOrder()`: the order-placement core (validation + write) for both delivery methods (`pickup` / `delivery`). Not cached.

Read functions embed the app's display order in SQL: products `ORDER BY sort_order, id`; pickup spots `ORDER BY city, sort_order, id`.

**API routes (`app/api/*/route.ts`)**
- GET `products` / `categories` / `pickup-spots` — thin wrappers; use `jsonHandler()` from `app/lib/api.ts` to centralize the try/catch → 500.
- POST `orders` — calls `createOrder`; returns 400 on `{ error }`, 201 on success.
- POST `revalidate` — admin-only (Bearer `ADMIN_SECRET_TOKEN`); calls `revalidateTag` for one of the allowed tags. Call this after editing data so the cached read functions refetch.

**Client (`components/`)** — all interactive components are `"use client"`. `App.tsx` is the root: it loads products/categories via the `useResource<T>(url, errorMessage)` hook (`app/lib/useResource.ts`, handles loading/error/unmount race), holds cart state, and persists the cart to `localStorage` under `cc_fresh_cart`. On product reload it reconciles the saved cart against the latest catalog (drops delisted items, overwrites stale price/name snapshots).

## Key conventions

- **Never trust client-sent prices.** `createOrder` ignores any amounts from the request and recomputes every line subtotal from the DB catalog via `calcLineSubtotal`.
- **Promotions use a strategy pattern** in `app/lib/promotions.ts` — this is the one module shared by both client and server, so keep it free of server-only imports. To add a discount type, define a `PromoStrategy` (validate / describe / subtotal) and add it to `PROMO_STRATEGIES`. Strategy config is stored in `products.promo_config` (JSONB) keyed by `products.promo_type`.
- **Shared validation** lives in `app/lib/validation.ts` (also client+server safe), e.g. `isValidTwMobile`.
- **DB ids are integers; the app uses strings.** Data-layer mappers convert (`String(row.id)`), and `createOrder` converts back with `Number(...)`.
- **Path alias** `@/*` maps to the repo root (e.g. `@/app/lib/db`, `@/types`).
- Shared types are in `types.ts` (root); `ProductPromo`/`PromoConfig` types live in `promotions.ts`.
- **Two delivery methods.** `pickup` requires a `(city, township)` resolving to a `pickup_spots` row; `delivery` requires a free-text `shipping_address`. `createOrder` branches on `deliveryMethod` for both validation and the insert.
- **`pickup_number` is the customer-facing order number for both methods** (the DB auto-id is never exposed). Pickup: max+1 scoped per spot, guarded by the `(pickup_spot_id, pickup_number)` unique constraint and retried on conflict. Delivery: `pickup_spot_id` is NULL and the number is max+1 across all delivery orders — NULL escapes that unique constraint, so the same retry runs but cannot fully prevent duplicate numbers under high concurrency (accepted trade-off).

## Design

`DESIGN.md` holds the design-system spec (color tokens, typography, component guidance) — consult it for visual/styling work.
