# Nuxt 4 vs Nuxt 3: LLM Awareness Notes

## Context
- Project start date: 2025-11-10
- Repository: `mini-library-management-system`
- Current branch: `vue3-spa-spec-building`
- Recent discussion explored whether we should remain on Nuxt 4 or downgrade to Nuxt 3 to stay closer to the LLM’s October 2024 training window.

## Summary of the Discussion
- **Nuxt 4 introduces intentional breaking changes** (directory layout, data fetching semantics, head management, TypeScript contexts, Nitro behavior, runtime defaults, module compatibility checks).
- Tooling exists to ease the migration (codemods, `future.compatibilityVersion`, documentation on breaking changes).
- **Nuxt 3 remains valid** if a module ecosystem dependency is not yet Nuxt 4 compatible or if zero migration effort is the priority.
- For this project, no critical blockers surfaced, so the recommendation was to stay on Nuxt 4.

## LLM-Specific Considerations
- Training data ends October 2024, so Nuxt 4 concepts may be newer or unfamiliar.
- Nuxt 3 habits could leak into code generation (e.g., expecting legacy directory structure or older `useAsyncData` behavior).
- The LLM can still operate effectively in Nuxt 4 provided up-to-date documentation is referenced whenever uncertainty arises.

## Working Principles Agreed Upon
1. **Stay on Nuxt 4** unless we hit a confirmed module blocker that lacks a Nuxt 4-compatible release.
2. **Back every implementation detail with current documentation** before coding:
   - Review Nuxt 4 docs for API signatures, directory conventions, data fetching defaults, and Nitro configuration.
   - Confirm module compatibility pages before integrating new modules.
3. **Use documentation first for troubleshooting and debugging** to catch assumptions inherited from Nuxt 3 patterns (e.g., null defaults, `window.__NUXT__`, auto-import paths).
4. **Leverage migration resources**: run the Nuxt 4 codemod if we inherit Nuxt 3 code, rely on the compatibility flag, and audit the TypeScript path mappings to align with Nuxt 4 defaults (e.g., `~` → `/app`, `@` → project root).
5. **Treat the docs as the source of truth** before designing new features to avoid outdated patterns.

## Action Items Going Forward
- Keep the project structure in Nuxt 4’s `app/` + optional `shared/` layout; update aliases as needed.
- Mirror Nuxt’s defaults in `tsconfig.json` (`~/*` → `./app/*`, `@/*` → `./*`).
- When implementing or refactoring features, skim Nuxt 4 docs first, then proceed with TDD and code generation.
- Document any Nuxt 4-specific findings or workarounds in this folder for future reference.

> **Reminder:** Before implementing or debugging, open the relevant section of https://nuxt.com/docs to confirm current behavior. This reduces mismatches between training-era knowledge and Nuxt 4 reality.
