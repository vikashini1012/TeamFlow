# TeamFlow — Updated UI + Database Setup

The project keeps the existing React + Express + Prisma/PostgreSQL architecture and applies the approved dark charcoal + lime visual system.

## UI
- Dark charcoal/black surfaces
- Lime primary accent
- Slightly larger, more readable typography
- Responsive sidebar/mobile drawer
- Dashboard analytics cards
- Dark authentication screens
- Consistent cards, controls, forms, alerts and modals

## Database
The backend uses PostgreSQL through Prisma 7 with `@prisma/adapter-pg`.

`backend/prisma.config.ts` is included so Prisma CLI commands can resolve `DATABASE_URL`.

Create/verify `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/teamflow"
JWT_SECRET="change-me"
```

## Run

Backend:
```powershell
cd backend
npm install
npm run db:check
npm run dev
```

Frontend:
```powershell
cd frontend
npm install
npm run build
npm run dev
```

Database health:
```text
GET http://localhost:5000/api/health/db
```

Success:
```json
{"status":"ok","database":"connected"}
```

Prisma Studio:
```powershell
cd backend
npx prisma studio
```

Do not commit production secrets.
