# Novus Field Control

Central control plane backend and admin panel for the Novus Field SaaS tenant registry and discovery platform.

## Packages

| Package | Description |
|---------|-------------|
| `novus-field-control-backend/` | NestJS REST API — tenant registry, billing, provisioning |
| `novus-field-control-frontend/` | React admin panel — Vite + shadcn/ui + Tailwind |

## Quick Start

### Backend

```sh
cd novus-field-control-backend
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run start:dev
```

API available at `http://127.0.0.1:4010/api` — Swagger docs at `/docs`.

Default admin credentials: `admin@novusfield.com` / `admin123456` (or set `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` in `.env`).

### Frontend

```sh
cd novus-field-control-frontend
npm install
npm run dev
```

Web app available at `http://localhost:5173`.

Set `VITE_CONTROL_API_URL=http://localhost:4010/api` in frontend `.env` for local development.

## Tech Stack

**Backend**: NestJS, Prisma, PostgreSQL, JWT (Passport), Swagger

**Frontend**: React 18, Vite, shadcn/ui (Radix), Tailwind CSS, React Query, React Router v6, Recharts, i18n (en/es/pt)

## Environment Variables

### Backend (see `.env.example`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default `4010`) |
| `DATABASE_URL` / `DIRECT_URL` | PostgreSQL connection |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | JWT signing secrets |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Initial admin credentials |

### Frontend (see `.env.example`)

| Variable | Description |
|----------|-------------|
| `VITE_CONTROL_API_URL` | Backend API URL (include `/api` suffix) |

## Available Scripts

### Backend

```sh
npm run start:dev         # Dev server with watch
npm run start             # Production start
npm run lint              # Lint source
npm run test              # Unit tests
npm run test:e2e          # E2E tests
npm run prisma:generate   # Generate Prisma client
npm run prisma:migrate    # Run migrations
npm run prisma:seed       # Seed initial data
npm run prisma:studio     # Open Prisma Studio
```

### Frontend

```sh
npm run dev               # Dev server
npm run build             # Production build
npm run build:dev         # Development build
npm run lint              # Lint all files
npm run test              # Run vitest tests
npm run test:watch        # Watch mode for tests
npm run i18n:check        # Check i18n completeness
npm run start             # Serve built dist/ locally
```

## Database

PostgreSQL at `127.0.0.1:3441`, database `novus_field_control`.

## Deploy

Both packages ship a `Dockerfile`. In Coolify, set Build Pack to **Dockerfile** for each application.

**Backend** — Base Directory `novus-field-control-backend`, port **4010**. The container runs migrations and the seed before starting, so `SEED_ADMIN_PASSWORD` (12+ chars) must be set or the boot fails on purpose.

**Frontend** — Base Directory `novus-field-control-frontend`, port **80** (nginx). `VITE_CONTROL_API_URL` must be set **before the build**: Vite inlines `VITE_*` variables into the bundle, so defining it only at runtime has no effect.
