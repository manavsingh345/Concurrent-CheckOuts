# Inventory Reservation System

A full-stack reservation system built to prevent checkout oversells under concurrency.

This project models products, warehouses, and per-warehouse inventory, then lets a user reserve stock for a short checkout window. The key requirement is correctness when multiple requests try to reserve the same last unit at the same time. The implementation solves that with an atomic PostgreSQL update inside a transaction, returning `409 Conflict` when stock is no longer available.

## What This Solves

In a naive checkout flow, two requests can both read "1 item left", both decide stock is available, and both decrement it. That race condition causes overselling.

This system avoids that by making reservation creation a single atomic database write:

```sql
UPDATE "Inventory"
SET "reservedStock" = "reservedStock" + $1
WHERE id = $2
  AND ("totalStock" - "reservedStock") >= $1
RETURNING id;
```

If the row updates, the reservation wins. If no row updates, stock was already taken and the API returns `409`.

## Solution Summary

- `Next.js App Router` for the UI and API routes
- `TypeScript` for end-to-end type safety
- `PostgreSQL` as the source of truth for inventory
- `Prisma` for schema, queries, and transactions
- `Upstash Redis` for reservation creation idempotency
- `Tailwind CSS` for the UI
- `Zod` for request validation
- `Vercel Cron` for expiring stale pending reservations

## Core Reservation Logic

The most important behavior in the entire project lives in [`lib/reservations.ts`](./lib/reservations.ts).

Reservation creation works like this:

1. Validate the incoming request.
2. Optionally check Redis for an `Idempotency-Key` replay.
3. Start a database transaction.
4. Execute one conditional `UPDATE` against the `Inventory` row.
5. If no row is updated, return `409 Conflict`.
6. If the row is updated, create a `PENDING` reservation in the same transaction.

This means there is no `SELECT -> compare in application code -> UPDATE` race window.

### Why It Is Correct Under Concurrency

If two requests arrive simultaneously for the last unit:

- both attempt the same conditional `UPDATE`
- PostgreSQL serializes the row update safely
- exactly one request can make the condition true and increment `reservedStock`
- the other request sees zero updated rows and gets `409 Conflict`

That is the core correctness guarantee for this exercise.

## Reservation Lifecycle

### `PENDING`

Created after a successful reservation request. It holds stock by increasing `reservedStock`.

### `CONFIRMED`

When checkout succeeds:

- `totalStock` is decremented
- `reservedStock` is decremented
- the reservation becomes `CONFIRMED`

### `CANCELLED`

When a user releases a reservation:

- `reservedStock` is decremented
- the reservation becomes `CANCELLED`

### `EXPIRED`

When the hold window ends:

- a cron endpoint finds expired `PENDING` reservations
- `reservedStock` is decremented
- the reservation becomes `EXPIRED`

## Architecture

### Frontend

- Product catalog page with warehouse selection and reserve flow
- Reservation detail page with:
  - countdown timer
  - confirm action
  - cancel action
  - live status refresh

### Backend

- API routes under `app/api`
- reservation business logic centralized in `lib/reservations.ts`
- read models in `lib/data.ts`
- validation in `lib/validators.ts`
- shared helpers in `lib/http.ts`, `lib/env.ts`, `lib/idempotency.ts`, and `lib/prisma.ts`

### Data model

The inventory source of truth is:

- `Inventory.totalStock`
- `Inventory.reservedStock`

Available stock is always computed as:

```text
totalStock - reservedStock
```

This keeps inventory accounting simple and makes the reservation check efficient.

## Database Schema

The schema is defined in [`prisma/schema.prisma`](./prisma/schema.prisma).

### Main entities

- `Product`
- `Warehouse`
- `Inventory`
- `Reservation`

### Important relationships

- one product can exist in many warehouses
- each `(productId, warehouseId)` pair has one `Inventory` row
- each reservation belongs to exactly one inventory row

## API Endpoints

### `GET /api/products`

Returns products plus per-warehouse inventory and available stock.

### `GET /api/warehouses`

Returns warehouse options.

### `POST /api/reservations`

Creates a pending reservation.

Request body:

```json
{
  "inventoryId": "string",
  "quantity": 1
}
```

Possible responses:

- `201 Created` when reservation succeeds
- `409 Conflict` when not enough stock is available
- `400 Bad Request` for invalid payload or invalid idempotency key

### `GET /api/reservations/:id`

Returns a reservation with its inventory, product, and warehouse data.

### `POST /api/reservations/:id/confirm`

Confirms a pending reservation and permanently consumes stock.

### `POST /api/reservations/:id/release`

Cancels a pending reservation and returns held stock.

### `GET /api/cron/release-expired`

Expires pending reservations whose `expiresAt` is in the past.

## Idempotency

The reservation creation endpoint supports an optional `Idempotency-Key` header.

Flow:

1. Hash the key and request body
2. Check Redis for a cached response
3. If found, return the cached result
4. If not found, process the reservation normally
5. Cache the successful response for 24 hours

This protects clients from accidental duplicate reservation submissions due to retries or flaky networks.

## Expiry Strategy

The app includes a Vercel cron configuration in [`vercel.json`](./vercel.json):

```json
{
  "crons": [
    {
      "path": "/api/cron/release-expired",
      "schedule": "* * * * *"
    }
  ]
}
```

Important:

- the schedule is every minute
- this requires a Vercel plan that supports per-minute cron execution
- on Vercel Hobby, cron jobs are limited to once per day

The cron endpoint also supports `CRON_SECRET` authorization in production.

## How Expiry Works In Production

In production, reservation expiry is handled by a scheduled Vercel cron job rather than by browser timers or client-side cleanup.

Flow:

1. Vercel triggers `GET /api/cron/release-expired` on the configured schedule.
2. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` when `CRON_SECRET` is configured in the project settings.
3. The route verifies the header before doing any work.
4. The backend finds `PENDING` reservations where `expiresAt <= NOW()`.
5. Those reservations are updated to `EXPIRED`.
6. Their reserved quantities are grouped by inventory row and deducted from `reservedStock` inside the same database transaction.

This design keeps expiry server-authoritative. Even if a user leaves a tab open or closes the browser, expired holds are still cleaned up and stock becomes available again.

Two important production notes:

- Vercel cron uses UTC scheduling.
- The current `* * * * *` schedule is valid for Pro or higher; Hobby plans only support once-per-day cron jobs.

## How To Run Locally

This project expects real environment variables, a PostgreSQL database, and seeded sample data before the UI becomes useful.

### 1. Install dependencies

```powershell
npm install
```

### 2. Configure environment variables

Copy `.env.example` into `.env` and set real values for:

```env
DATABASE_URL=""
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""
CRON_SECRET=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESERVATION_TTL_MINUTES="10"
```

Notes:

- `DATABASE_URL` should point to your Postgres instance from Supabase, Neon, or another provider.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` come from your Upstash Redis database.
- `CRON_SECRET` can be any long random string and is mainly needed for protected cron execution in production.

### 3. Generate Prisma client

```powershell
npm run db:generate
```

### 4. Apply the schema to the database

This project uses Prisma schema sync for local setup:

```powershell
npm run db:push
```

If you prefer formal SQL migrations later, that would be a good next hardening step, but for this exercise `db:push` keeps setup fast.

### 5. Seed sample data

```powershell
npm run db:seed
```

### 6. Start the app

```powershell
npm run dev
```

Open:

```text
http://localhost:3000
```

### Fresh local setup in one sequence

```powershell
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

## Test And Verification

### Lint

```powershell
npm run lint
```

### Production build

```powershell
npm run build
```

### Concurrency test

Use the included script:

```powershell
npm run test:concurrency -- http://localhost:3000 <inventoryId> 1 50
```

Expected result for inventory with `5` available units:

- `5` successful reservations
- `45` `409 Conflict` responses

### Manual flow

1. Open the product catalog
2. Reserve stock from a warehouse
3. Confirm the purchase or cancel it
4. Verify the reservation page updates correctly
5. Trigger the cron endpoint manually to test expiry behavior

## Project Structure

```text
app/
  api/
  reservations/
components/
  home/
  reservations/
  ui/
lib/
  data.ts
  env.ts
  http.ts
  idempotency.ts
  prisma.ts
  reservations.ts
  utils.ts
  validators.ts
prisma/
  schema.prisma
  seed.mjs
scripts/
  concurrency-test.mjs
vercel.json
```

## Design Decisions And Trade-Offs

### Why PostgreSQL atomic updates instead of Redis locks?

Because inventory truth already lives in PostgreSQL. For a single-database stock system, conditional row updates are simpler, safer, and avoid introducing a second consistency boundary for the critical reservation path.

Redis is used only where it adds clear value here: idempotency and response replay.

### Why keep `reservedStock` separate from `totalStock`?

Because a checkout hold is not a sale yet.

- `reservedStock` tracks temporary holds
- `totalStock` tracks actual inventory on hand
- confirmation converts a hold into a sale by decrementing both

### Why centralize reservation rules in one module?

Because correctness is easier to maintain when all state transitions live in one place instead of being scattered across API handlers.

## Trade-Offs And What I Would Improve With More Time

### Trade-offs made for this exercise

- I used `prisma db push` for fast local setup instead of a formal migration history. That is convenient for an exercise, but production systems usually want versioned migrations.
- I used a cron-based expiry sweep every minute rather than a queue or worker system. It is simple and reliable for this scope, but it is not the most precise or scalable option for very high reservation volume.
- I kept reservations tied to a single inventory row. That keeps the concurrency story clean, but it does not support split fulfillment across multiple warehouses.
- I applied Redis idempotency only to reservation creation, where duplicate submission risk is highest. Confirm and release remain simpler non-idempotent mutations in v1.
- I did not add authentication, user ownership, or a real order/payment model so the solution could stay focused on the concurrency requirement.

### With more time, I would

- add formal Prisma migrations and deployment-safe migration documentation
- add automated integration tests that spin up Postgres and verify concurrent reservation behavior repeatedly
- add a background worker or queue option for more precise expiration handling at scale
- introduce an order model so `CONFIRMED` reservations become traceable purchases rather than just stock movements
- add observability around reservation conflicts, expiry counts, and cron execution outcomes
- make idempotency behavior more robust for all mutation endpoints, not only reservation creation

## Known Limitations

- no authentication or user-specific ownership of reservations
- no order or payment model beyond reservation confirmation
- one reservation maps to one inventory row only
- the current seed script wipes existing sample data before reseeding
- real end-to-end behavior still depends on valid Postgres and Upstash credentials

## Files Worth Reviewing First

- [`lib/reservations.ts`](./lib/reservations.ts) for the concurrency-safe reservation flow
- [`prisma/schema.prisma`](./prisma/schema.prisma) for the data model
- [`app/api/reservations/route.ts`](./app/api/reservations/route.ts) for the main reservation endpoint
- [`app/api/cron/release-expired/route.ts`](./app/api/cron/release-expired/route.ts) for expiry handling

## Final Notes

This project is intentionally centered around one key backend guarantee:

> inventory reservation must remain correct even when multiple requests hit the same stock concurrently.

Everything else in the system, from the UI to cron expiry to idempotency, supports that guarantee rather than replacing it.
