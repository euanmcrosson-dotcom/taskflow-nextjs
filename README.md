# TaskFlow 🚀

A powerful task management app built with Next.js + Prisma + Auth.js.

## Deployment on Vercel

This app is ready to deploy on Vercel.

### Recommended Database
Use **Neon** or **Supabase** (free tier available) for PostgreSQL.

### Environment Variables needed on Vercel:
- `DATABASE_URL`
- `DIRECT_URL` (for Prisma)
- `AUTH_SECRET` (generate with `openssl rand -base64 32`)

## Local Development
```bash
npm install
npx prisma generate
npm run db:push
npm run dev
```