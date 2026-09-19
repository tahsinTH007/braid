# Braid

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socket.io)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?logo=clerk&logoColor=white)

A community forum with threaded discussions, replies, likes, and real-time direct messaging — built with Next.js, Express, Socket.io, and PostgreSQL.

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [Deployment](#deployment)

## Features

- **Threads** — browse, search, and filter discussion threads by category
- **Replies & likes** — comment on threads and like the ones you're into
- **Direct messages** — real-time 1:1 chat with typing indicators, online presence, and image attachments
- **Notifications** — real-time alerts when someone replies to or likes your thread
- **Profiles** — display name, handle, bio, and avatar (upload an image or paste a URL)
- **Auth** — sign in/up with [Clerk](https://clerk.com)

## Tech stack

| | |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Clerk, Socket.io client |
| **Backend** | Express, TypeScript, Socket.io, PostgreSQL (`pg`), Clerk, Multer |
| **Database** | PostgreSQL ([Neon](https://neon.tech) or any Postgres host) |

## Project structure

```
line_chat_app/
├── frontend/             # Next.js app
│   ├── vercel.json         # Vercel build config
│   └── src/
│       ├── app/             # routes (threads, chat, profile, notifications, auth)
│       ├── components/      # UI + feature components
│       ├── hooks/           # socket + notification count hooks
│       └── lib/             # API client, utils
├── backend_update_v2/    # Express API + Socket.io server
│   └── src/
│       ├── routes/          # HTTP route handlers
│       ├── modules/         # domain logic (threads, chat, users, notifications)
│       ├── realtime/        # Socket.io setup + presence
│       ├── migrations/      # SQL schema migrations
│       └── db/               # migrate.ts / seed.ts scripts
└── docker-compose.yml    # local Postgres container (optional)
```

## Getting started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (local via `docker-compose up -d`, a local install, or a hosted instance like [Neon](https://neon.tech))
- A free [Clerk](https://clerk.com) application (for auth keys)

### 1. Clone and install

```bash
git clone git@github.com:tahsinTH007/braid.git
cd braid

cd frontend && npm install
cd ../backend_update_v2 && npm install
```

### 2. Configure environment variables

Copy the example env files and fill in your own values:

```bash
cp frontend/.env.example frontend/.env
cp backend_update_v2/.env.example backend_update_v2/.env
```

- `backend_update_v2/.env` — database connection (either discrete `DB_*` vars, or a single `NEON_BD_URL` connection string), `CORS_ORIGIN`, and your Clerk secret/publishable keys
- `frontend/.env` — your Clerk publishable/secret keys, and `NEXT_PUBLIC_API_BASE_URL` pointing at the backend

### 3. Set up the database

```bash
cd backend_update_v2
npm run migrate   # creates all tables
npm run seed      # optional: adds mock users, threads, replies, likes, and DMs
```

### 4. Run it

In two terminals:

```bash
# backend — http://localhost:5000 (or PORT from .env)
cd backend_update_v2 && npm run dev

# frontend — http://localhost:3000
cd frontend && npm run dev
```

## Scripts

**`frontend/`**

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

**`backend_update_v2/`**

| Command | Description |
|---|---|
| `npm run dev` | Start the API with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run migrate` | Apply SQL migrations |
| `npm run seed` | Insert mock data (idempotent) |

## Deployment

Vercel hosts the frontend well, but its serverless functions don't support the backend's persistent Socket.io connections. Recommended split:

- **Frontend** → [Vercel](https://vercel.com), root directory set to `frontend` (uses the included [`frontend/vercel.json`](frontend/vercel.json))
- **Backend** → a host with long-running processes, e.g. [Render](https://render.com), [Railway](https://railway.app), or [Fly.io](https://fly.io) — build with `npm run build`, start with `npm start`
- **Database** → a managed Postgres such as [Neon](https://neon.tech), Render, or Supabase — set `NEON_BD_URL` (or the discrete `DB_*` vars) on the backend

After deploying, set `CORS_ORIGIN` on the backend to your Vercel domain, and `NEXT_PUBLIC_API_BASE_URL` on the frontend to your backend's public URL.
