# Tailwind CSS vs component <style> blocks — a hybrid approach

Quick note — this document compares two common styling approaches for Vue 3 single-file components (SFCs) and recommends a practical hybrid pattern you can adopt immediately.

## Short answer / recommendation
- For fastest development, consistency across the app, and easier automatic styling in small teams, Tailwind CSS + Vue 3 SFCs is the better default.
- Use Tailwind for layout/utility and rapid iteration; use component-scoped `<style>` blocks for component-specific, non-trivial styling (animations, complex selectors, third‑party overrides). This hybrid keeps productivity high while keeping CSS well scoped where it matters.

## Why (concise pros / cons)

### 1) Tailwind CSS (utility-first)
- Pros
  - Very fast to prototype and iterate — fewer context switches between HTML and CSS.
  - Enforces visual consistency (utility set) and reduces the number of bespoke class names.
  - Great for small teams / single developers: you write less CSS.
  - Works naturally inside Vue SFC templates; purge/JIT removes unused CSS for small builds.
  - Easy to compose with design tokens (CSS vars) and to make responsive styles.
- Cons
  - Template class lists can become long/verbose for complex UI; readability suffers if not structured.
  - Less semantic HTML unless you use component wrappers or comment conventions.
  - You still need custom CSS for complex states, pseudo-elements, and deep selectors (so not a total replacement).

### 2) Vue SFCs with `<style>` blocks (scoped or global)
- Pros
  - Semantic, expressive CSS; easy to reason about for designers.
  - Scoped styles isolate component styling (no accidental leakage), good for complex components.
  - Cleaner templates (no long class attribute noise).
  - Easier to write complex selectors, animations, and specific overrides.
- Cons
  - More CSS files to maintain; risk of duplicated rules across components.
  - Slower to prototype compared to utility-first approach.
  - Requires discipline for shared tokens and consistent spacing/colors (or a shared variables file).

## Edge cases & practical considerations
- Accessibility: Tailwind doesn’t change a11y, but utility usage can hide semantic intent — keep clear markup and aria attributes.
- Theming: CSS variables + Tailwind’s config work well together (use Tailwind theme + CSS variables for runtime theme changes).
- Build size: enable purge/JIT so Tailwind doesn’t bloat your final CSS.
- SSR/Nuxt: ensure purge paths include all .vue and server-rendered templates (Nuxt has specific integration steps).
- Long class attributes: use helper functions (clsx) or small presentational components to wrap complex groups of utilities.

## Practical hybrid pattern (recommended)
- Use Tailwind for:
  - Layouts, spacing, small presentational bits, responsive utilities, typography basics.
- Use `<style scoped>` in SFCs for:
  - Component-specific visuals (complex interactions, animations, pseudo-elements).
  - Anything needing complex selectors or CSS that is painful to express in utilities.
- Use `@apply` (Tailwind) inside component `<style>` blocks to create semantic utility bundles:
  - Example: In `<style scoped>`: `.card { @apply p-4 bg-white rounded-lg shadow-md }` then template uses `<div class="card">` — readable + utility under the hood.
- Put all shared variables in a small CSS variables file (or Tailwind config) so colors/spacing are consistent.

## Quick “how to get started” (Tailwind + Vue 3 + Vite example)
1. Install Tailwind and PostCSS dependencies:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. Configure `tailwind.config.js` — set `content`/`purge` to include your `.vue`/`.js`/`.ts` files, e.g.:

```js
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: { extend: {} },
  plugins: [],
}
```

3. In your main CSS (imported by `main.js`/`main.ts`) add:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

4. Use Tailwind classes in your `.vue` templates and use `<style scoped>` for component-specific CSS or complex selectors.

5. Enable production purging (Tailwind v3+ uses JIT by default) and verify your build strips unused utilities.

6. Optionally use `@apply` to bundle reusable utility sets into semantic class names inside `<style scoped>`.
