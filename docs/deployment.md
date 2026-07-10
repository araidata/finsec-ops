# Deployment

## Target Platform

- Hosting: Vercel
- Database: Neon PostgreSQL through the Vercel Integration

## Phase 1

The target database is Neon PostgreSQL through the Vercel Integration. Prisma
commands prefer the unpooled Neon connection variables
`POSTGRES_URL_NON_POOLING` or `DATABASE_URL_UNPOOLED`, then fall back to
`DATABASE_URL` or `POSTGRES_PRISMA_URL`.

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
variables injected by Vercel at runtime. Application runtime clients use
`DATABASE_URL` or `POSTGRES_PRISMA_URL` and remain pooled.

Vercel builds generate the Prisma client but do not run migrations. Apply
reviewed migrations as an explicit deployment step before promoting schema
dependent application code:

```bash
npm run migrate:deploy
```

Keeping migrations out of the build path avoids repeated deploys contending for
the same Prisma advisory migration lock. Using the unpooled Neon URL for
explicit Prisma commands also avoids advisory locks getting stranded behind the
pooled connection layer.

## Future Deployment Notes

- Keep runtime clients lazily initialized so builds do not require production
  secrets.
- Keep provider boundaries portable for a possible future AWS deployment using
  PostgreSQL and Amazon Bedrock.
