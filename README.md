# QAIS Foods — Lentil Factory ERP & Portal (LFO-FCMS)

University lab project: public wholesale shop, customer portal, and internal ERP.

## Quick start (instructor / evaluator)

**Requirements:** Node.js 18+, npm

```bash
npm install
npm run dev
```

Open **http://localhost:5000**

`npm install` automatically creates `.env` from `.env.example` (lab Supabase keys included).

## Students

Submit your `.env` file when the instructor asks. To use your own Supabase project, replace the values in `.env` after install.

## Stack

- React 19 · TypeScript · Vite 5 · Tailwind CSS 4 · shadcn/ui
- Zustand · TanStack Query · Supabase

## Documentation

See **[AGENTS.md](./AGENTS.md)** for routes, roles, and troubleshooting.

## Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install deps + create `.env` if missing |
| `npm run dev` | Dev server (port 5000) |
| `npm run build` | Production build |

## Notes

- Use **npm only** — do not run `pnpm install` in this folder.
- SQL migrations are in the repo root for Supabase setup.
