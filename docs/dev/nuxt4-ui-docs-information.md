# Nuxt UI usage notes (Nuxt 4.2)

_Last updated: 2025-11-10_

## Original working assumption

Before double-checking the Nuxt UI documentation for Nuxt 4.2 / Nuxt UI v4.1, the plan was to:

- Base the global shell on `UApp`, then use `UDashboardLayout` / `UDashboardPage` for back-office routes while composing generic layout primitives (header, sidebar, content) for public pages.
- Reach for a short list of Nuxt UI primitives by name (`UApp`, `UDashboardLayout`, `UDashboardPage`, `USlideover`, `UBreadcrumb`, `UCard`, `USection`, `UTabs`, `UTable`, `UModal`, `UDialog`, `UNotification`, `UForm`, `UFormGroup`, `UInput`, `USelectMenu`, `UTextarea`, `UCheckbox`, `URadioGroup`, `UButton`).
- Assume those component names were part of the stable API available in Nuxt 4.2 without cross-referencing their exact categories.

## What the docs clarified

Checking [ui.nuxt.com/docs/components](https://ui.nuxt.com/docs/components) (Nuxt UI v4.1) showed a few differences:

- `UDashboardLayout` / `UDashboardPage` are not exposed as singular components. The dashboard experience is composed from a suite of primitives under the **Dashboard** section (`DashboardGroup`, `DashboardNavbar`, `DashboardSidebar`, `DashboardSidebarToggle`, `DashboardToolbar`, etc.). Those work together to produce the responsive shell we expected.
- Public/member layouts are better expressed with the generic layout building blocks Nuxt UI provides (`Header`, `Main`, `Footer`, `Container`, `PageSection`, `PageHeader`) instead of a monolithic “dashboard page” component.
- The data, overlay, and form components referenced earlier do exist, but it’s important to cite their exact names from the docs (`UCard`, `UTabs`, `Empty`, `UTable`, `Pagination`, `UModal`, `UDialog`, `Toast`, `USlideover`, `UForm`, `UFormField`, `UInput`, `USelect`, `USelectMenu`, `UCheckbox`, `URadioGroup`, `UTextarea`, `USwitch`, `UButton`).
- Nuxt UI v4.1 is bundled with Nuxt 4.2, so everything in that catalog is usable without opt-in modules, but pro-only components are not included—worth noting for agents.

## Updated plan (Nuxt 4.2 aligned)

- Wrap `app.vue` with `UApp` to enable the global providers Nuxt UI expects (tooltips, toasts, config provider).
- For librarian/admin routes use the dashboard primitives: `DashboardGroup`, `DashboardNavbar`, `DashboardSidebar`, `DashboardSidebarToggle`, `DashboardToolbar`, with `USlideover` as the mobile drawer.
- For guest/member/public routes combine `Header`, `NavigationMenu`, `Main`, `Footer`, `Container`, `PageSection`, and `PageHeader`.
- Surface content with `UCard`, `UTabs`, `PageSection`, `PageHeader`, `Empty`, `UTable`, and `Pagination`, styling them via Tailwind utilities tethered to the shared design tokens.
- Use `UModal`, `UDialog`, bundled toasts (`Toast`/`UNotification`), and `USlideover` for overlays.
- Standardize forms on `UForm`, `UFormField`, `UInput`, `USelect`, `USelectMenu`, `UCheckbox`, `URadioGroup`, `UTextarea`, `USwitch`, and `UButton`.
- Continue to rely on Tailwind v4 `@theme` tokens as the single source of truth, routing Nuxt UI theme settings through `app.config.ts` so both layers stay in sync.

This document should be updated again if Nuxt UI introduces new layout primitives or changes component names in future releases.

## Icon module notes (`@nuxt/icon` v2.1)

- **Docs reviewed**: [nuxt.com/modules/icon](https://nuxt.com/modules/icon) (covers setup, server bundle modes, Tailwind v4 note).
- **Key takeaways**:
	- Module registers a global `<Icon>` component. Nuxt 4 projects can add it with `npx nuxi module add icon` or list `modules: ['@nuxt/icon']` in `nuxt.config.ts`.
	- Icon sources come from Iconify collections. Recommended approach is to install the specific `@iconify-json/<collection>` packages (e.g., `@iconify-json/heroicons-outline`) and list them under `icon.serverBundle.collections` so icons are bundled locally for SSR.
	- Tailwind CSS v4 users should keep the component in `css` mode and set `cssLayer: 'base'` via `app.config.ts` to ensure utility classes apply (`export default defineAppConfig({ icon: { mode: 'css', cssLayer: 'base' } })`).
	- Defaults for size, class, aliases, and customizable SVG transforms live in `app.config.ts > icon`. Setting `icon.size = '20px'` and `icon.aliases` lets us change iconography from one place.
	- `icon.serverBundle` supports `auto | local | remote`. We stay on `auto`, but the spec notes we can flip to `remote` or `none` if bundle size or CDN delivery becomes a concern.

## Image module notes (`@nuxt/image` v2)

- **Docs reviewed**: [nuxt.com/modules/image](https://nuxt.com/modules/image) (module overview) and [image.nuxt.com/usage/nuxt-img](https://image.nuxt.com/usage/nuxt-img) & [image.nuxt.com/get-started/configuration](https://image.nuxt.com/get-started/configuration) (props, presets, screens).
- **Key takeaways**:
	- Install with `npx nuxi module add image` (already present in this repo). Module exposes `<NuxtImg>` and `<NuxtPicture>`.
	- Responsive behaviour comes from the `sizes` prop (e.g., `sizes="100vw sm:60vw md:400px"`). Defaults mirror Tailwind’s breakpoints unless overridden in `image.screens`.
	- Presets let us centralise modifiers, sizes, placeholders, and densities inside `nuxt.config.ts`. Agents should create a `cover` preset for media art with `{ sizes: '100vw sm:60vw md:400px lg:360px', modifiers: { fit: 'cover', format: 'webp', quality: 75 }, placeholder: [32, 18, 70, 4] }` and call it via `preset="cover"` on components.
	- `loading="lazy"` stays as the default hint; add `densities="x1 x2"` for sharper retina rendering and keep `alt` text mandatory per docs.
	- Whitelist Supabase storage via `image.domains` and, if we move assets under `app/assets`, adjust `image.dir`. These changes live in config only, keeping the implementation easy to tweak later.
	- For custom placeholders or external providers, reference the documented `useImage()` composable and provider configuration sections.
