# Plant Tracker

A mobile-first web app to track your plants, watering schedules, and growth — built with Next.js, Prisma, and PostgreSQL.

## Tech Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** v4 (mobile-first)
- **Prisma** ORM + PostgreSQL
- **NextAuth** (Credentials / Single-user mode)
- **Zod** for validation

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL running locally (or via Docker)

### Setup

```bash
# Install dependencies
npm install

# Copy env file and adjust DATABASE_URL
cp .env.example .env

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Using Docker Compose (local)

```bash
docker compose up -d
```

This starts PostgreSQL + the app on port 3000. The app runs `prisma db push` on startup.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/plant_tracker` |
| `AUTH_SECRET` | NextAuth secret (generate with `openssl rand -base64 32`) | — |
| `UPLOAD_DIR` | Directory for photo uploads | `./public/uploads` |
| `SINGLE_USER_MODE` | Skip auth, auto-create admin user | `true` |
| `IDENT_PROVIDER` | Plant identification provider (`mock` \| `inaturalist`) | `mock` |

## Deploy on Coolify (Raspberry Pi)

1. Create a new project in Coolify
2. Connect your Git repository (or use Dockerfile deploy)
3. Set environment variables:
   - `DATABASE_URL` → your PostgreSQL connection string
   - `AUTH_SECRET` → random secret
   - `SINGLE_USER_MODE` → `true`
4. Build command: Docker (Dockerfile is included)
5. Port: `3000`
6. Add a persistent volume mounted at `/app/public/uploads` for photos

### Using existing PostgreSQL on Raspberry Pi

Set `DATABASE_URL` to your existing PostgreSQL instance. The app runs `prisma db push` on container start, which creates all tables automatically.

## Project Structure

```
src/
├── app/
│   ├── actions/        # Server Actions (plants, check-ins, watering)
│   ├── api/            # API routes (upload, identify-plant, auth)
│   ├── plants/         # Plant pages (list, new, detail)
│   ├── login/          # Login page
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Dashboard
├── components/
│   ├── ui/             # Reusable UI components (Button, Card, etc.)
│   ├── nav.tsx         # Bottom navigation
│   ├── photo-upload.tsx
│   ├── status-badge.tsx
│   └── empty-state.tsx
└── lib/
    ├── auth.ts         # NextAuth configuration
    ├── db.ts           # Prisma client singleton
    ├── identification.ts # Plant ID provider interface + mock
    ├── storage.ts      # Storage adapter (local filesystem)
    ├── user.ts         # Default user helper
    ├── utils.ts        # cn() utility
    └── validations.ts  # Zod schemas
```

## Limitations & Next Steps

- **Auth**: MVP uses single-user mode. Add proper password hashing (bcrypt) for multi-user.
- **Photos**: Stored locally. Swap `LocalStorageAdapter` for S3/MinIO adapter for production.
- **Plant ID**: Uses mock provider. Integrate PlantNet or similar API.
- **PWA**: Manifest is included, but no service worker yet.
- **Image optimization**: Using `<img>` tags; switch to `next/image` with proper width/height for production.
- **Tests**: Not included in MVP. Add Vitest + React Testing Library.
