# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo with two packages:
- `novus-field-control-backend/` — NestJS API (control plane for Novus Field SaaS tenant registry)
- `novus-field-control-frontend/` — React admin panel (Vite + shadcn/ui + Tailwind)

## Backend Commands

```sh
cd novus-field-control-backend

npm run start:dev          # Start API on http://127.0.0.1:4010/api (with Swagger at /docs)
npm run lint                # Lint source and test files
npm run test                # Run unit tests
npm run test:watch          # Watch mode for tests
npm run test:e2e            # End-to-end tests
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Run migrations (use -- --name <name>)
npm run prisma:seed         # Seed initial admin user
npm run prisma:studio       # Open Prisma Studio
```

## Web Commands

```sh
cd novus-field-control-frontend

npm run dev                 # Development server
npm run build               # Production build → dist/
npm run build:dev           # Development build
npm run lint                # Lint all files
npm run test                # Run vitest tests
npm run test:watch          # Watch mode for tests
npm run i18n:check          # Check i18n completeness
npm run start               # Serve dist/ locally (uses PORT env var, defaults to 4173)
```

## Database

PostgreSQL at `127.0.0.1:3441`, database `novus_field_control`. Set via `DATABASE_URL`/`DIRECT_URL` in backend `.env`.

## Initial Setup

1. Backend: `npm run prisma:migrate -- --name init` then `npm run prisma:seed`
2. Web: `npm install` then `npm run dev`

## Backend Architecture (NestJS)

Modules under `src/modules/`:
- `auth/` — JWT authentication, session management with Passport
- `tenants/` — Tenant CRUD
- `tenant-resolver/` — GraphQL-style tenant resolution/discovery
- `billing/` — Billing profiles and invoices
- `provisioning-projects/` — Project provisioning tracking

Prisma schema at `prisma/schema.prisma`. Key models: `ControlAdmin`, `ControlSession`, `Tenant`, `TenantBillingProfile`, `BillingInvoice`, `ProvisioningProject`.

## Web Architecture (React + shadcn/ui)

State: React Query for server state, React context for UI state (`src/contexts/`).

Auth: JWT stored in memory/authtoken cookie (backend sessions at `ControlSession`).

API: Frontend reads `VITE_CONTROL_API_URL` env var pointing to backend API + `/api`.

Routing: `react-router-dom` v6, pages under `src/pages/`, components under `src/components/`.

UI: shadcn/ui (Radix primitives + Tailwind), `vaul` for drawers, `sonner` for toasts, `recharts` for charts.

## Environment Variables

**Backend** (see `.env.example`):
- `PORT` — API port (default 4010)
- `DATABASE_URL` / `DIRECT_URL` — PostgreSQL connection
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — JWT signing secrets
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — Initial admin credentials (defaults: `admin@novusfield.com` / `admin123456`)

**Web** (see `.env.example`):
- `VITE_CONTROL_API_URL` — Backend API URL with `/api` suffix

## Build & Deploy

**Backend**: NestJS build → `dist/src/main.js` as entry point.

**Web**: Vite build → `dist/` directory. Production uses `serve` to serve the static build. In Coolify, publish `dist/` as the static site. Build command: `npm ci && npm run build`. Set `VITE_CONTROL_API_URL` to the public backend URL.
