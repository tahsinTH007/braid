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
- [Realtime & serverless](#realtime--serverless)
- [Deployment](#deployment)

## Features

- **Threads** — browse, search, and filter discussion threads by category
- **Replies & likes** — comment on threads and like the ones you're into
- **Direct messages** — 1:1 chat with typing indicators, online presence, and image attachments. Instant via Socket.io when the host supports it, otherwise falls back to REST + polling (see [Realtime & serverless](#realtime--serverless))
- **Notifications** — alerts when someone replies to or likes your thread (live via socket, or synced by polling)
- **Profiles** — display name, handle, bio, and avatar (upload an image or paste a URL)
- **Auth** — sign in/up with [Clerk](https://clerk.com)

## Tech stack

| | |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Clerk, Socket.io client |
| **Backend** | Express, TypeScript, Socket.io, PostgreSQL (`pg`), Clerk, Multer, Vercel Blob |
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
│   ├── api/index.ts        # Vercel serverless entry point (Express app, no sockets)
│   ├── vercel.json          # Vercel build config for the API
│   └── src/
│       ├── server.ts        # traditional entry point (http server + Socket.io)
│       ├── routes/          # HTTP route handlers
│       ├── modules/         # domain logic (threads, chat, users, notifications)
│       ├── realtime/        # Socket.io setup (typing indicator, message push)
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

## Realtime & serverless

Socket.io needs a persistent connection, which serverless platforms like Vercel don't provide (functions are stateless and spin down between requests). So the app runs in one of two modes automatically, no config needed:

- **Socket connects** (traditional host: Render, Railway, Fly, a VPS, or `npm run dev` locally) → messages, typing, and notifications push instantly.
- **Socket can't connect** (Vercel) → sending falls back to a REST endpoint, new messages/notifications are picked up by short polling (a few seconds), and "online" status comes from a heartbeat the client pings every ~25s instead of a live disconnect event.

Either way the UI and API are identical — only the delivery speed of realtime updates changes.

## Deployment

### Option A — both on Vercel

- **Frontend** → import the repo, root directory `frontend` (uses [`frontend/vercel.json`](frontend/vercel.json))
- **Backend** → import the repo **again as a second project**, root directory `backend_update_v2` (uses [`backend_update_v2/vercel.json`](backend_update_v2/vercel.json), which routes all requests to [`api/index.ts`](backend_update_v2/api/index.ts))
- **Database** → [Neon](https://neon.tech) (or any Postgres) — set `NEON_BD_URL` in the backend project's environment variables
- **File uploads** → enable **Blob** storage on the backend Vercel project; it injects `BLOB_READ_WRITE_TOKEN` automatically, which switches uploads from local disk to Blob
- Set `CORS_ORIGIN` on the backend to the frontend's `*.vercel.app` URL, and `NEXT_PUBLIC_API_BASE_URL` on the frontend to the backend's `*.vercel.app` URL
- Run `npm run migrate` (and optionally `npm run seed`) against the Neon database once, from your machine, pointed at the same `NEON_BD_URL`

This gets real-time-ish chat (polling, a few seconds of lag) with everything on one platform. See [Realtime & serverless](#realtime--serverless) above for what that trades off.

### Option B — frontend on Vercel, backend on a persistent host

- **Frontend** → [Vercel](https://vercel.com), root directory `frontend`
- **Backend** → [Render](https://render.com), [Railway](https://railway.app), or [Fly.io](https://fly.io) — build with `npm run build`, start with `npm start` (uses `src/server.ts`, the traditional entry point)
- **Database** → [Neon](https://neon.tech), Render, or Supabase
- Uploaded images write to local disk on the host (fine as long as it has a persistent filesystem, unlike Vercel)

This keeps Socket.io fully instant since the backend is always-on.
