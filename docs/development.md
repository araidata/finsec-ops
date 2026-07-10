# Development

## Workflow

1. Read `README.md`.
2. Read `TODO.md`.
3. Confirm the active phase.
4. Keep changes inside the active phase.
5. Update documentation for architecture, folder structure, model, workflow, or
   tooling changes.
6. Update `TODO.md` after meaningful work is completed.
7. Record significant decisions in `architecture/decisions`.

## Local Commands

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
npm run test:e2e
npm run prisma -- validate
npm run prisma -- format
```

Pull Vercel-managed Neon variables before running Prisma commands against a
real database:

```bash
vercel env pull .env.local --environment=development --yes
npm run prisma -- migrate dev
npm run prisma -- db seed
```

## Implementation Rules

- Keep React components focused on presentation and composition.
- Put domain operations in services when real behavior begins.
- Put integration-specific code behind providers.
- Avoid new dependencies unless they clearly improve maintainability.
- Use shadcn/ui primitives and semantic Tailwind tokens before custom styling.
