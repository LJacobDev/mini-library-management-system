# LLM Training Cutoff Updates

_Last updated: 2025-11-12_

> Use this document to capture **only** information that changed after the model training cutoff (e.g., new Nuxt/Tailwind/Supabase behaviors).

- **2025-11-12** — Nuxt UI v4 modal control uses the `v-model:open` syntax alongside prefixed components (e.g. `<NuxtModal>` when `ui.prefix = 'Nuxt'`). Title/description props replace legacy header slots, and close actions can be wired through the `#footer` slot via the provided `close` callback.
