# TaskFlow 🚀

A powerful task management app built with **Next.js + Prisma + SQLite** and secure Server Actions.

## Features
- Projects & Tasks with real database
- Priority, due dates, status tracking
- Secure Server Actions with Zod
- Delete projects & tasks

## Setup

```bash
npm install
npx prisma generate
npm run db:push     # Create database tables
npm run dev
```

## Scripts
- `npm run db:push` - Push schema to SQLite
- `npm run db:studio` - Open Prisma Studio

Now using a real database instead of in-memory storage!