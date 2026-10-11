# Clothing Website

E-commerce storefront (catalog, cart, orders) — Next.js frontend, Express/Prisma backend, single PostgreSQL database.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS — `frontend/`
- **Backend:** Node.js + Express + TypeScript + Prisma — `backend/`
- **Database:** PostgreSQL

## Getting started

### 1. Start PostgreSQL

Using Docker (from the repo root):

```bash
docker compose up -d
```

Or point `backend/.env`'s `DATABASE_URL` at your own existing Postgres instance.

### 2. Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run prisma:generate
npx prisma db seed
npm run dev
```

Backend runs on `http://localhost:5000`. Health check: `GET /health`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Project structure

```
backend/
  prisma/schema.prisma   # Product, Variant, Category, User, Cart, Order models
  src/
    controllers/         # Request handlers
    routes/               # Express routers
    middleware/           # Auth (JWT), error handling
    server.ts             # App entry point

frontend/
  src/
    app/                  # Next.js App Router pages
    lib/api.ts            # Fetch wrapper for backend API
    types/                 # Shared TS types mirroring the Prisma models
```

## Notes

- Orders decrement variant stock inside a single Postgres transaction (`order.controller.ts`) to avoid overselling under concurrent checkouts.
- Product/variant data uses JSONB (`attributes` field) for flexible catalog metadata, avoiding the need for a second database.
