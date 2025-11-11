# Unit & Integration Test Guide

This folder captures guidance and shared utilities for the Nuxt 4 / Supabase test stack. It should evolve alongside the `docs/dev/spec/spec-final.md` testing charter (section 11).

## Goals

- Enforce the edge-case-first + TDD workflow: write the failing test first, then implement the feature, then consider refactor if it's not complex.
- Keep shared helpers (mock API client, streaming chunk factory, Supabase stubs) in one place so component and server-route tests stay focused on behaviour.
- Ensure every public-facing contract (Zod schemas, adapter methods, server routes) has at least one happy-path and one edge-case test.

## Running the suite

The examples below assume a Windows `cmd.exe` shell with the default npm scripts. If you prefer another package manager, translate the commands accordingly.

```cmd
npm run test
```

Recommended watch mode for local development:

```cmd
npm run test -- --watch
```

When working on composables or adapter logic, prefer colocated `*.spec.ts` files inside the relevant directory. Use this `tests/unit` folder for cross-cutting helpers or when Vitest snapshots/fixtures need a dedicated home.

## Tooling stack

- **Vitest** drives unit + integration tests.
- **@nuxt/test-utils** loads Nuxt context and renders components/server routes in isolation.
- **MSW (Mock Service Worker)** and the custom adapter mock factory simulate Supabase/OpenAI calls without hitting external services.
- **happy-dom** is the default DOM environment. Switch to Playwright (E2E) only once flows stabilise.

## Folder conventions

```
tests/
  unit/
    README.md           ← this guide
    mocks/              ← reusable fixtures/mocked responses
    setup/              ← Vitest setup files (test env, global mocks)
```

Add `tests/unit/setup/vitest.setup.ts` when we need global hooks (e.g., for MSW or `vi.mock` defaults). Reference it from `vitest.config.ts` once that file exists.

## Writing new tests

1. Start with the edge-case checklist in `docs/dev/edge-case-checklist.md`.
2. Introduce a failing spec that mirrors the chosen edge case.
3. Implement the minimal code change to pass.
4. Refactor with confidence (lint, type-check, run full suite before commit).
5. Update this guide whenever the workflow or tooling changes.
