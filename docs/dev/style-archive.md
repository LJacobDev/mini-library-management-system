# Style archive — black & green theme

Captured: 2025-11-12

This file stores the current 'black & green' visual theme so it can be restored later or used for reference. The app currently uses Nuxt UI color tokens and Tailwind utility classes derived from those tokens. Below are the primary token mappings and notes about where they're applied.

## Primary Nuxt UI tokens (approx)

- --ui-primary: oklch(72.3% 0.219 149.579) /* green-500 */
- --ui-secondary: oklch(62.3% 0.214 259.815) /* blue-500 */
- --ui-success: oklch(72.3% 0.219 149.579) /* green-500 */
- --ui-info: oklch(62.3% 0.214 259.815) /* blue-500 */
- --ui-warning: oklch(79.5% 0.184 86.047) /* yellow-500 */
- --ui-error: oklch(63.7% 0.237 25.331) /* red-500 */

## Tailwind utility highlights

- Backgrounds: `bg-slate-950` + `bg-slate-900/60` used for dark panels and cards.
- Accents: `from-emerald-500 via-cyan-500 to-sky-500` used in hero/feature gradients.
- Live indicators: `bg-lime-300` with `animate-ping` used for streaming/ai statuses.
- Borders and subtle lines: `border-cyan-500/30` used on important panels.

## Where this theme shows up

- `app/components/OpenAIStatus.vue` — gradient container with dark inner panel and lime ping indicators.
- `app/layouts/dashboard.vue` — dashboard shell uses slate backgrounds with cyan accents.
- `app/pages/index.vue` — homepage hero and backend-check cards.

## Notes & restoration

- If restoring, re-apply the above tokens to `nuxt-ui-colors` or Tailwind config.
- Keep this file as the canonical archive for the theme; when a redesign is ready, create `docs/dev/style-new-proposal.md` with the proposed palette and contrast checks.


---

Generated automatically on 2025-11-12 by the fast-start agent context update.