# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CC 生鮮 (CC Fresh) — a single-page frozen-food ordering site. Next.js 16 (App Router) + React 19 + Tailwind CSS v4, backed by Neon serverless Postgres. UI copy and inline comments are in Traditional Chinese.

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- `npm run typecheck` — TypeScript check without emitting files
- `npm test` — fast Vitest unit tests; no browser or database required
- `npm run test:watch` — Vitest in watch mode
- `npm run check` — run lint, typecheck, and unit tests; use this as the default local verification
- `npm run test:e2e` — Playwright e2e (`e2e/`, projects: ios / android / desktop). Tests place REAL orders through the dev server into the `.env.local` `DATABASE_URL`. A global-setup guard (`e2e/global-setup.ts`) refuses to run unless the DB host is in its `ALLOWED_TEST_DB_HOSTS` allowlist — add the new host there when the test database changes. There is no row cleanup.

## Environment

Copy `.env.example` → `.env.local` and fill in:
- `DATABASE_URL` — Neon Postgres connection string (use the pooled connection)
- `ADMIN_SECRET_TOKEN` — Bearer token guarding `POST /api/revalidate`; also sent when calling the admin app's `/api/revalidate` back (shared secret)
- `ADMIN_URL` — admin app base URL; after an order decrements stock, its `/api/revalidate` is notified so the admin's product cache refreshes (optional — unset skips the call)

The DB schema is not in this repo; tables referenced: `products`, `categories`, `pickup_spots`, `orders`, `order_items`.

## Architecture

Data flows DB → server data layer → API route → client. There is no server-rendered product data; `app/page.tsx` renders the client `<App/>`, which fetches everything over `/api/*`.

**Domain layer (`app/domain/`)** — pure TypeScript business rules with no React, Next.js, browser, or database dependencies. Keep logic here whenever it can be expressed from inputs to outputs, and colocate its `*.test.ts` file:
- `cart.ts` — parses current and legacy cart storage, changes quantities, and hydrates compact `{ id, quantity }` rows from the latest catalog.
- `order.ts` — validates and normalizes order input, merges duplicate product rows, enforces a combined per-product maximum of 999, and recomputes line subtotals from the authoritative catalog.

**Data layer (`app/lib/`)** — server-only modules wrapping SQL:
- `db.ts` — single `sql` export (Neon HTTP driver). Always query via its tagged-template form so values are parameterized.
- `products.ts`, `categories.ts`, `pickup-spots.ts` — each exports a read function wrapped in `unstable_cache` with a cache tag (`"products"`, `"categories"`, `"pickup-spots"`). Results are cached until the tag is revalidated.
- `orders.ts` — database adapter for order placement and lookup. `createOrder()` loads the authoritative catalog, delegates pure validation/pricing to `prepareOrder()`, resolves pickup spots, and writes the order. Not cached.

Read functions embed the app's display order in SQL: products `ORDER BY sort_order, id`; pickup spots `ORDER BY city, sort_order, id`.

**API routes (`app/api/*/route.ts`)**
- GET `products` / `categories` / `pickup-spots` — thin wrappers; use `jsonHandler()` from `app/lib/api.ts` to centralize the try/catch → 500.
- POST `orders` — calls `createOrder`; returns 400 on `{ error }`, 201 on success.
- POST `revalidate` — admin-only (Bearer `ADMIN_SECRET_TOKEN`); calls `revalidateTag` for one of the allowed tags. Call this after editing data so the cached read functions refetch.

**Client (`components/`)** — all interactive components are `"use client"`. `App.tsx` is the root: it loads products/categories via the `useResource<T>(url, errorMessage)` hook (`app/lib/useResource.ts`, handles loading/error/unmount race), holds cart state, and persists only `{ id, quantity }` rows to `localStorage` under `cc_fresh_cart`. It delegates cart parsing and catalog hydration to `app/domain/cart.ts`, so delisted items are dropped and stale product snapshots are never used.

## Testing

- Put deterministic business rules in `app/domain/` and test them with colocated `*.test.ts` files.
- Vitest is configured in `vitest.config.ts` to include only unit tests under `app/` and `components/`; it explicitly excludes `e2e/` so Playwright specs are never collected by the unit-test runner.
- Run `npm run check` during normal development. Run `npm run build` when changing framework boundaries, configuration, server/client imports, or production behavior.
- Reserve Playwright for critical cross-layer API/UI/database flows. `npm run test:e2e` is not part of `npm run check` because it starts the app and writes real rows to the allowlisted test database.
- Prefer dependency-free domain tests over mocking Next.js or Neon. Keep route handlers and DB modules thin enough that most behavior can be verified without either service.

## Key conventions

- **Never trust client-sent prices.** `createOrder` loads the DB catalog and `prepareOrder` recomputes every line subtotal via `calcLineSubtotal`; request amounts are ignored.
- **Stock (防超賣).** `products.stock` is a remaining-sellable counter maintained by the admin app: `NULL` = untracked (no check, no decrement), `0` = sold out. `prepareOrder` pre-checks against the (possibly cached) catalog for friendly per-product messages (「name」庫存不足（剩餘 N）, joined with ；). The real guard is in `insertOrder`: the order, its items, and the stock decrement ride one CTE statement, so the DB constraint `products_stock_nonneg` (SQLSTATE 23514, filtered by constraint name) atomically aborts the whole order on insufficiency — concurrent orders serialize on row locks and can never oversell. On 23514 the current stock is re-queried to build the same message shape. After a successful order, `createOrder` calls `revalidateCache("products")` (`app/lib/revalidate.ts`) — it revalidates the local `products` tag and best-effort notifies the admin app's `/api/revalidate` (`ADMIN_URL` + shared `ADMIN_SECRET_TOKEN`) so both catalogs reflect new stock. UI: sold-out products show a 售完 overlay and a disabled add button (`ProductCard`), `hydrateCart` drops sold-out cart rows and caps quantities at remaining stock, and the stepper's `+` disables at the cap.
- **Promotions use a strategy pattern** in `app/lib/promotions.ts` — this is the one module shared by both client and server, so keep it free of server-only imports. To add a discount type, define a `PromoStrategy` (validate / describe / subtotal) and add it to `PROMO_STRATEGIES`. Strategy config is stored in `products.promo_config` (JSONB) keyed by `products.promo_type`.
- **Shared validation** lives in `app/lib/validation.ts` (also client+server safe), e.g. `isValidTwMobile`.
- **DB ids are integers; the app uses strings.** Data-layer mappers convert (`String(row.id)`), and `createOrder` converts back with `Number(...)`.
- **Path alias** `@/*` maps to the repo root (e.g. `@/app/lib/db`, `@/types`).
- Shared types are in `types.ts` (root); `ProductPromo`/`PromoConfig` types live in `promotions.ts`.
- **Two delivery methods.** `pickup` requires a `(city, township)` resolving to a `pickup_spots` row; `delivery` requires a free-text `shipping_address`. `createOrder` branches on `deliveryMethod` for both validation and the insert.
- **`pickup_number` is the customer-facing order number for both methods** (the DB auto-id is never exposed). Sequences are **per spot × per source tag** (`orders.tag`: this app always writes `網站`; `FB` / `Line` orders come from the admin app): max+1 scoped by `(pickup_spot_id, tag)`, guarded by the `UNIQUE NULLS NOT DISTINCT (pickup_spot_id, tag, pickup_number)` constraint (admin migration `009`) and retried on conflict. Delivery orders use the same pattern within the `pickup_spot_id IS NULL` scope, still split by tag.
- **Displayed order numbers are spot code + source letter + number.** `pickup_spots.code` (1–3 uppercase letters, maintained by the admin app, unique per route) prefixes pickup orders; the source letter comes from `orders.tag` — FB has none (legacy format, e.g. `A5`), Line inserts `L` (`AL5`), 網站 inserts `S` (`AS5`); delivery orders drop the spot code but keep the letter (`7` / `L7` / `S7`). The API returns the pre-formatted string as `pickupCode` (`OrderConfirmation` / `LookupOrder`) — clients never compose it. The code is joined live from `pickup_spots`, never snapshotted, so an admin-side code change immediately changes existing orders' displayed numbers.

## Design

`DESIGN.md` holds the design-system spec (color tokens, typography, component guidance) — consult it for visual/styling work.
