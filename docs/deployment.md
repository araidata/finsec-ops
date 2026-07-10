# Deployment

## Target Platform

- Hosting: Vercel
- Database: Neon PostgreSQL through the Vercel Integration

## Phase 1

The target database is Neon PostgreSQL through the Vercel Integration. Prisma
commands read `DATABASE_URL` first and fall back to `POSTGRES_PRISMA_URL`, which
matches the common Vercel-managed Neon pooled connection variable.

Do not commit database secrets. Pull Vercel environment variables into
`.env.local` for local development:

```bash
vercel env pull .env.local --environment=development --yes
```

The linked `finsec-ops` Vercel project has the Neon integration connected for
Production, Preview, and Development. `DATABASE_URL`, `POSTGRES_PRISMA_URL`,
`POSTGRES_URL`, unpooled URL variants, PG compatibility variables, and
`NEON_PROJECT_ID` are Vercel-managed encrypted variables and should remain
uncommitted.

`prisma.config.ts` loads `.env.local` before `.env` so local Prisma commands use
the Vercel-pulled Neon URL. Vercel deployments continue to use the environment
variables injected by Vercel at runtime.

## Future Deployment Notes

- Keep runtime clients lazily initialized so builds do not require production
  secrets.
- Keep provider boundaries portable for a possible future AWS deployment using
  PostgreSQL and Amazon Bedrock.
