# Residente

Residential community web app: Next.js 15 (App Router) + TypeScript + SQLite (Node's built-in `node:sqlite`, Node >= 22.13).

## Setup

```bash
npm install
npm run db:seed              # admin/admin123, resident/resident123, sample areas and residence
npm run dev
```

The schema is applied automatically on first start (`migrations/*.sql`); `npm run db:migrate` runs it explicitly.

## Scripts
`dev`, `build`, `start`, `lint`, `typecheck`, `test`, `db:migrate`, `db:seed`.

## Structure
- `src/app/(auth)/login` login; `(admin)/admin/{users,residences,areas}`; `(resident)/{page,payments,agenda}`
- `src/server/{db,auth,repos}` SQLite access, sessions/passwords, domain logic (reservations, payments)
- `src/lib/validation` zod schemas
- Reservation times are community-local naive datetimes (`YYYY-MM-DDTHH:mm`); money is integer cents.
