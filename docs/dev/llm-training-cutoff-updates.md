# LLM Training Cutoff Updates

_Last updated: 2025-11-13_

> Use this document to capture **only** information that changed after the model training cutoff (e.g., new Nuxt/Tailwind/Supabase behaviors).

- **2025-11-12** — Nuxt UI v4 modal control uses the `v-model:open` syntax alongside prefixed components (e.g. `<NuxtModal>` when `ui.prefix = 'Nuxt'`). Title/description props replace legacy header slots, and close actions can be wired through the `#footer` slot via the provided `close` callback.
- **2025-11-13** — Nuxt UI v4 now warns in dev if `title` and `description` are omitted on `<NuxtModal>`, so we must pass both props (or aria-label equivalents) to satisfy the updated accessibility checks. Action buttons should live in the named `actions` slot where Nuxt UI injects spacing and semantics for primary/secondary CTAs.
- **2025-11-13** — Nuxt UI v4 honours the `ui.prefix` value (`'Nuxt'` in our `nuxt.config.ts`). Components are auto-registered only under that prefix (e.g., `<NuxtCard>`, `<NuxtButton>`). Using legacy `U*` tags triggers “Failed to resolve component” warnings; always import or reference the prefixed alias to match project conventions.
