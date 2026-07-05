# TU Notes Hub

TU Notes Hub is a Next.js app for browsing and managing semester/year notes with authentication, admin tooling, AI comparison, payments, and uploads.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
copy .env.example .env.local
```

3. Fill required values in `.env.local`.

4. Start dev server:

```bash
npm run dev
```

## Required environment variables

Minimum required to build and run:

- `DATABASE_URL`
- `JWT_SECRET`

Used by email features:

- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`

Used by AI features:

- `GEMINI_KEY_1`
- `GEMINI_KEY_2`
- `GEMINI_KEY_3`

Used by upload/media features:

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional:

- `NEXT_TELEMETRY_DISABLED=1`

## Vercel deployment checklist

Add the same environment variables in Vercel Project Settings for all needed environments (Production, Preview, Development).

Most common Prisma error:

```txt
Environment variable not found: DATABASE_URL
--> schema.prisma
```

Fix: add `DATABASE_URL` in Vercel settings and redeploy.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
