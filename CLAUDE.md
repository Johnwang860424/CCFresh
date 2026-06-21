# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

CC 生鮮 (CC Fresh) — a single-page frozen-food ordering site. Next.js 16 (App Router) + React 19 + Tailwind CSS v4, backed by Neon serverless Postgres. UI copy and inline comments are in Traditional Chinese.

## Commands

- `npm run dev` — dev server at http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve production build
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`; no separate test suite exists)

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
- `orders.ts` — `createOrder()`: the order-placement core (validation + write). Not cached.

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
- Pickup orders get a per-spot incrementing `pickup_number`; concurrent inserts may hit the `(pickup_spot_id, pickup_number)` unique constraint and are retried.

## Design

`DESIGN.md` holds the design-system spec (color tokens, typography, component guidance) — consult it for visual/styling work.
