# Deployment

## Target Platform

- Hosting: Vercel
- Database: Neon PostgreSQL through the Vercel Integration

## Phase 0

No deployment-specific resources are required. The app has no persistence,
authentication, API routes, or environment variables yet.

## Future Deployment Notes

- Add `DATABASE_URL` only when Phase 1 creates the approved Prisma schema.
- Keep runtime clients lazily initialized so builds do not require production
  secrets.
- Keep provider boundaries portable for a possible future AWS deployment using
  PostgreSQL and Amazon Bedrock.
