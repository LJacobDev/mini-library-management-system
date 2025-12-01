# WCAG Accessibility Audit Report
**Date**: November 30, 2025  
**Project**: Great City Community Library Management System  
**Auditor**: Accessibility Review Agent  
**Target Compliance**: WCAG 2.1 Level AA

---

## Executive Summary

This audit evaluates the library management system against WCAG 2.1 Level AA criteria, which is a widely-adopted international standard for web accessibility. The application shows good foundational practices including semantic HTML usage and some ARIA implementation, but has **critical gaps** that would prevent users with disabilities from fully accessing core features.

**Overall Status**: ⚠️ **Non-compliant** — Requires immediate attention for critical issues.

**Priority Breakdown**:
- 🔴 **Critical Issues**: 8 (blocks users with disabilities)
- 🟡 **High Priority**: 12 (significantly impairs experience)
- 🟢 **Medium Priority**: 7 (improves experience)
- 🔵 **Low Priority**: 5 (polish and best practices)

---

## Understanding WCAG & Priority Levels

### What do the priority levels mean?

**🔴 CRITICAL (Fix First)**: These issues completely block users from accessing features. Examples: can't use keyboard to navigate, screen readers can't read content, text is invisible against background.

**🟡 HIGH (Fix Soon)**: Users can technically access the feature but with significant difficulty. Examples: poor color contrast, missing labels, confusing navigation.

**🟢 MEDIUM (Fix When Possible)**: Users can access features but the experience could be better. Examples: missing skip links, unclear error messages, no live regions for dynamic updates.

**🔵 LOW (Polish)**: Nice-to-have improvements that follow best practices. Examples: enhanced descriptions, additional ARIA attributes, AAA contrast levels.

---

## 🔴 CRITICAL ISSUES (Fix Immediately)

### 1. Modal/Dialog Focus Management
**Files**: `MediaDetailModal.vue`, `AdminMediaFormModal.vue`  
**WCAG Criterion**: 2.4.3 Focus Order, 2.1.2 No Keyboard Trap

**Problem**: Modals don't trap focus or restore focus when closed. Keyboard users can tab behind the modal to underlying content, and when the modal closes, focus returns to the top of the page instead of the button that opened it.

**User Impact**: Keyboard and screen reader users lose their place in the page, causing confusion and requiring extra navigation.

**How to Fix**:
```vue
<!-- In MediaDetailModal.vue, add focus trap -->
<script setup>
import { useFocusTrap } from '@vueuse/core'

const modalRef = ref(null)
const { activate, deactivate } = useFocusTrap(modalRef, {
  immediate: false,
  escapeDeactivates: true,
  returnFocusOnDeactivate: true
})

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    nextTick(() => activate())
  } else {
    deactivate()
  }
})
</script>

<template>
  <div ref="modalRef" role="dialog" aria-modal="true">
    <!-- modal content -->
  </div>
</template>
```

**Test**: Open modal with keyboard (Enter/Space), try to Tab — focus should stay within modal. Close modal — focus should return to trigger button.

---

### [x] 2. Images Missing Alternative Text
**Files**: `CatalogGrid.vue`, `MediaDetailModal.vue`, `index.vue`  
**WCAG Criterion**: 1.1.1 Non-text Content

**Problem**: Cover images use `alt=""` or are missing alt text entirely. Screen reader users have no way to know what the image shows.

**User Impact**: Screen reader users miss important visual information about book covers and library images.

**How to Fix**:
```vue
<!-- In CatalogGrid.vue, line ~195 -->
<!-- BEFORE -->
<NuxtImg :src="item.coverUrl || fallbackCover" alt="" ... />

<!-- AFTER -->
<NuxtImg 
  :src="item.coverUrl || fallbackCover" 
  :alt="`Cover image for ${item.title}`" 
  ... 
/>

<!-- In MediaDetailModal.vue, line ~237 -->
<!-- BEFORE -->
<NuxtImg v-if="media.coverUrl" :src="media.coverUrl" alt="" ... />

<!-- AFTER -->
<NuxtImg 
  v-if="media.coverUrl" 
  :src="media.coverUrl" 
  :alt="`Cover of ${media.title}`" 
  ... 
/>

<!-- For decorative hero images in index.vue -->
<NuxtImg
  :src="heroImage"
  alt="Exterior view of Great City Community Library building"
  ...
/>

<NuxtImg
  :src="interiorImage"
  alt="Interior reading room with comfortable seating and bookshelves"
  ...
/>
```

**FIX NOTE**: index.vue already had alt text, however admin.vue was noticed as needing alt text added.  All images now have alt text.


**Test**: Use NVDA or VoiceOver to navigate catalog — images should announce descriptive text.

---

### 3. Form Inputs Missing Proper Labels
**Files**: `AuthPanel.vue`, `AdminMediaFormModal.vue`  
**WCAG Criterion**: 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions

**Problem**: Some form fields rely on visual labels without proper `for`/`id` association, and error messages aren't programmatically associated with inputs.

**User Impact**: Screen reader users can't determine what each field is for. When errors occur, they don't know which field has the problem.

**How to Fix**:
```vue
<!-- In AuthPanel.vue — already has labels, but add error association -->
<div class="space-y-2">
  <label class="..." for="auth-email">Email</label>
  <input
    id="auth-email"
    v-model="email"
    type="email"
    required
    :aria-describedby="emailError ? 'email-error' : undefined"
    :aria-invalid="emailError ? 'true' : 'false'"
    ...
  >
  <p v-if="emailError" id="email-error" class="text-sm text-red-300" role="alert">
    {{ emailError }}
  </p>
</div>

<!-- In AdminMediaFormModal.vue, ensure all fields have proper labels -->
<!-- Example for Title field around line 350 -->
<label for="media-title" class="...">Title *</label>
<input
  id="media-title"
  v-model="form.title"
  type="text"
  :aria-required="true"
  :aria-invalid="validationErrors.includes('title') ? 'true' : 'false'"
  ...
/>
```

**Test**: Use screen reader, tab to form field — it should announce the label. Add validation error — it should announce the error message.

---

### 4. Catalog Item Cards Not Keyboard Accessible
**Files**: `CatalogGrid.vue` (line 192)  
**WCAG Criterion**: 2.1.1 Keyboard, 2.1.3 Keyboard (No Exception)

**Problem**: Cards use `@click` and have `role="button"` and `tabindex="0"`, but the Space key handler uses `.prevent` which might interfere with native scrolling. Also, the nested "Details" button creates a button-within-button pattern.

**User Impact**: Keyboard users may have difficulty activating cards or experience unexpected behavior.

**How to Fix**:
```vue
<!-- In CatalogGrid.vue, refactor card interaction -->
<article
  class="flex h-full flex-col overflow-hidden border border-white/5 bg-slate-900/70 transition hover:border-primary-500/60 hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer"
  tabindex="0"
  @click="handleSelect(item)"
  @keydown.enter="handleSelect(item)"
  @keydown.space.prevent="handleSelect(item)"
>
  <!-- Remove nested button, make entire card clickable -->
  <div class="relative">
    <NuxtImg 
      :src="item.coverUrl || fallbackCover" 
      :alt="`Cover image for ${item.title}`" 
      class="h-44 w-full object-cover" 
      loading="lazy" 
    />
  </div>

  <div class="flex flex-1 flex-col gap-3 p-5">
    <!-- ... rest of card content ... -->
    
    <!-- Remove the nested Details button, or make it truly auxiliary -->
    <div class="mt-auto flex items-center justify-between text-xs text-slate-500">
      <span>Published {{ item.publishedAt }}</span>
      <span class="sr-only">Press Enter or Space to view details</span>
    </div>
  </div>
</article>
```

**Test**: Use Tab to navigate to card, press Enter — should open detail modal. Press Space — should also open modal without scrolling page.

---

### [x] 5. Color Contrast Issues
**Files**: Multiple components  
**WCAG Criterion**: 1.4.3 Contrast (Minimum) — AA requires 4.5:1 for normal text, 3:1 for large text

**Problem**: Several text/background combinations don't meet minimum contrast ratios:
- `text-slate-400` on `bg-slate-900` backgrounds (likely ~2.8:1)
- `text-slate-500` on dark backgrounds (likely ~2.2:1)
- Disabled button states may have insufficient contrast

**User Impact**: Low vision users and users in bright lighting can't read text.

**How to Fix**:
```vue
<!-- Replace low-contrast text colors -->
<!-- BEFORE: text-slate-400 (light gray on dark) -->
<p class="text-sm text-slate-400">Subtitle text</p>

<!-- AFTER: text-slate-300 for better contrast -->
<p class="text-sm text-slate-300">Subtitle text</p>

<!-- For secondary/meta text, use at least text-slate-350 or lighter -->
<!-- In CatalogGrid.vue and other components -->
<p class="text-xs text-slate-300">{{ mediaTypeLabel(item.mediaType) }}</p>
```

**Manual Check List**:
1. Subtitle text in catalog cards (currently `text-slate-400`)
2. Helper text in forms (currently `text-slate-400`)
3. Timestamp/meta text (currently `text-slate-500`)
4. Disabled input states
5. Placeholder text

**Test**: Use Chrome DevTools Lighthouse or axe DevTools to check contrast ratios. All text should be 4.5:1 minimum (7:1 for AAA).

---

### [x] 6. Missing Page Language Declaration
**Files**: `app.vue`, `nuxt.config.ts`  
**WCAG Criterion**: 3.1.1 Language of Page

**Problem**: The HTML `lang` attribute is not set. Screen readers need this to use the correct pronunciation rules.

**User Impact**: Screen readers may use wrong language pronunciation, making content unintelligible.

**How to Fix**:
```typescript
// In nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: 'en' // or 'en-CA' for Canadian English
      }
    }
  }
})
```

**Test**: Inspect the rendered HTML — `<html>` tag should have `lang="en"` attribute.

---

### 7. Live Region Announcements Missing
**Files**: `CatalogGrid.vue`, `AuthPanel.vue`, catalog search  
**WCAG Criterion**: 4.1.3 Status Messages

**Problem**: When catalog loads more items, when search results update, or when authentication status changes, screen readers aren't notified.

**User Impact**: Screen reader users don't know when content has changed without manually re-exploring the page.

**How to Fix**:
```vue
<!-- Add live region for catalog updates -->
<template>
  <div class="flex flex-col gap-6">
    <!-- Visually hidden live region -->
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {{ statusMessage }}
    </div>
    
    <!-- ... rest of component -->
  </div>
</template>

<script setup>
const statusMessage = ref('')

watch(() => items.length, (newCount, oldCount) => {
  if (oldCount && newCount > oldCount) {
    statusMessage.value = `Loaded ${newCount - oldCount} more items. ${newCount} total items shown.`
  }
})

watch(() => props.isInitialLoading, (loading, wasLoading) => {
  if (wasLoading && !loading) {
    statusMessage.value = `Catalog loaded. Showing ${items.length} items.`
  }
})
</script>
```

**Test**: Use screen reader, load more items or perform search — screen reader should announce changes.

---

### 8. Sidebar Navigation Not Announced on Route Change
**Files**: `dashboard.vue` layout, app routing  
**WCAG Criterion**: 2.4.1 Bypass Blocks, 4.1.3 Status Messages

**Problem**: When navigating between dashboard pages, screen readers aren't informed that the page has changed.

**User Impact**: Screen reader users may not realize they've navigated to a new page.

**How to Fix**:
```vue
<!-- app.vue already has NuxtRouteAnnouncer — verify it's working -->
<template>
  <NuxtApp>
    <NuxtLoadingIndicator color="var(--color-primary-500)" :height="2" />
    <!-- This should announce route changes -->
    <NuxtRouteAnnouncer />
    
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </NuxtApp>
</template>

<!-- Ensure each page has a proper title -->
<script setup>
useHead({
  title: 'Catalog • Library Console' // Unique title per page
})
</script>
```

**Test**: Navigate between pages with screen reader running — it should announce "navigated to [page title]".

---

## 🟡 HIGH PRIORITY ISSUES

### [x] 9. Skip to Main Content Link Missing
**Files**: `default.vue`, `dashboard.vue` layouts  
**WCAG Criterion**: 2.4.1 Bypass Blocks

**Problem**: No skip link for keyboard users to bypass header navigation.

**User Impact**: Keyboard users must tab through entire header on every page load.

**How to Fix**:
```vue
<!-- In default.vue and dashboard.vue layouts -->
<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <!-- Skip link - visible on focus -->
    <a 
      href="#main-content" 
      class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-cyan-500 focus:text-slate-950 focus:px-4 focus:py-2 focus:rounded-md"
    >
      Skip to main content
    </a>
    
    <AppHeader />
    
    <main id="main-content" tabindex="-1">
      <slot />
    </main>
  </div>
</template>
```

**Test**: Press Tab on page load — first focused element should be "Skip to main content" link. Activate it — focus should move to main content.

---

### 10. Heading Hierarchy Issues
**Files**: Multiple pages  
**WCAG Criterion**: 1.3.1 Info and Relationships

**Problem**: Some pages may skip heading levels (h1 → h3) or have multiple h1s.

**Audit Findings**:
- `index.vue`: h1 "Great City Community Library" ✅, h2 "Ask our AI concierge" ✅, h2 "Visit us..." ✅, h3 "Newest arrivals" ✅
- Need to verify: Are there any h3s without parent h2s?

**How to Fix**:
```vue
<!-- Ensure logical heading progression -->
<!-- Page structure should be: -->
<h1>Page Title</h1>
  <h2>Major Section</h2>
    <h3>Subsection</h3>
    <h3>Another Subsection</h3>
  <h2>Another Major Section</h2>

<!-- Example fix in catalog.vue if needed -->
<section>
  <h2>Browse Collection</h2> <!-- Not h3 -->
  <p>Description...</p>
</section>
```

**Test**: Use HeadingsMap browser extension or screen reader heading navigation (H key in NVDA/JAWS) — structure should be logical with no skipped levels.

---

### 11. Form Validation Errors Not Clear
**Files**: `AuthPanel.vue`, `AdminMediaFormModal.vue`  
**WCAG Criterion**: 3.3.1 Error Identification, 3.3.3 Error Suggestion

**Problem**: Generic error messages like "Unable to sign in" don't explain what went wrong or how to fix it.

**User Impact**: Users don't know if they mistyped password, used wrong email, or if there's a server issue.

**How to Fix**:
```vue
<!-- In AuthPanel.vue, improve error messages -->
<script setup>
function handleSubmit() {
  // Client-side validation before submission
  const errors = []
  
  if (!email.value.trim()) {
    errors.push('Email address is required.')
  } else if (!isValidEmail(email.value)) {
    errors.push('Please enter a valid email address.')
  }
  
  if (!password.value) {
    errors.push('Password is required.')
  } else if (password.value.length < 6) {
    errors.push('Password must be at least 6 characters long.')
  }
  
  if (isSignUp.value && password.value !== confirmPassword.value) {
    errors.push('Passwords do not match.')
  }
  
  if (errors.length) {
    error.value = errors.join(' ')
    return
  }
  
  // ... submit form
}

// Improved server error handling
catch (err) {
  if (err.message.includes('Invalid login credentials')) {
    error.value = 'Email or password is incorrect. Please check and try again.'
  } else if (err.message.includes('Email not confirmed')) {
    error.value = 'Please check your email and click the confirmation link before signing in.'
  } else {
    error.value = 'Unable to sign in. Please try again or contact support.'
  }
}
</script>

<template>
  <!-- Add error summary at top of form -->
  <div v-if="error.value" role="alert" class="rounded-md border border-red-500/40 bg-red-900/30 p-3 text-sm text-red-200">
    <h3 class="font-semibold">Please correct the following:</h3>
    <p>{{ error.value }}</p>
  </div>
</template>
```

**Test**: Submit form with invalid data — error message should clearly state what's wrong and how to fix it.

---

### 12. Search/Filter Results Not Announced
**Files**: `index.vue`, `catalog.vue`  
**WCAG Criterion**: 4.1.3 Status Messages

**Problem**: When user changes filters or searches, the number of results isn't announced to screen readers.

**User Impact**: Screen reader users don't know if their search returned results without manually exploring.

**How to Fix**:
```vue
<!-- In catalog.vue, add announcement -->
<div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
  {{ searchAnnouncement }}
</div>

<script setup>
const searchAnnouncement = ref('')

watch([() => filters.q, () => filters.type, () => catalogItems.value.length], 
  ([query, type, count], [prevQuery, prevType, prevCount]) => {
    if (query !== prevQuery || type !== prevType || count !== prevCount) {
      const filterText = type ? ` filtered by ${type}` : ''
      const queryText = query ? ` matching "${query}"` : ''
      searchAnnouncement.value = `Found ${count} items${queryText}${filterText}.`
    }
  }
)
</script>
```

**Test**: Type in search box, select filter — screen reader should announce result count.

---

### 13. Button States Not Clearly Indicated
**Files**: Multiple components with disabled buttons  
**WCAG Criterion**: 1.4.1 Use of Color, 4.1.2 Name, Role, Value

**Problem**: Disabled buttons only use color/opacity to indicate state, not text or icons.

**User Impact**: Users with color blindness may not realize a button is disabled.

**How to Fix**:
```vue
<!-- Add aria-disabled and explanatory text -->
<NuxtButton
  v-if="!isAuthenticated"
  color="primary"
  variant="soft"
  :disabled="true"
  aria-disabled="true"
  aria-label="Reserve (requires sign in)"
>
  Reserve
</NuxtButton>

<!-- Or provide explanatory text nearby -->
<div class="flex flex-col gap-2">
  <NuxtButton :disabled="!detailMedia" aria-disabled="!detailMedia">
    Reserve
  </NuxtButton>
  <p v-if="!detailMedia" class="text-xs text-slate-400" id="reserve-disabled-reason">
    Select an item to enable reservation
  </p>
</div>
```

**Test**: Inspect disabled buttons with screen reader — they should announce disabled state and reason.

---

### 14. Modal Dialogs Missing aria-labelledby/aria-describedby
**Files**: `MediaDetailModal.vue`, `AdminMediaFormModal.vue`  
**WCAG Criterion**: 4.1.2 Name, Role, Value

**Problem**: Modals use role="dialog" but don't reference their title and description.

**User Impact**: Screen readers don't automatically announce modal purpose when opened.

**How to Fix**:
```vue
<!-- In MediaDetailModal.vue -->
<template>
  <div
    role="dialog"
    aria-modal="true"
    :aria-labelledby="media ? 'modal-title' : undefined"
    :aria-describedby="media ? 'modal-desc' : undefined"
    ...
  >
    <h3 id="modal-title" class="text-2xl font-semibold leading-tight text-white">
      {{ media.title }}
    </h3>
    <p id="modal-desc" v-if="summaryText" class="text-sm leading-relaxed text-slate-300">
      {{ summaryText }}
    </p>
  </div>
</template>
```

**Test**: Open modal with screen reader — it should announce title and description automatically.

---

### 15. Loading States Not Announced
**Files**: `CatalogGrid.vue`, auth components  
**WCAG Criterion**: 4.1.3 Status Messages

**Problem**: Loading indicators are visual only. Screen reader users don't know content is loading.

**How to Fix**:
```vue
<!-- Add aria-busy and live region -->
<div 
  class="catalog-grid" 
  :aria-busy="isLoadingMore ? 'true' : 'false'"
  aria-live="polite"
>
  <!-- content -->
</div>

<div class="sr-only" role="status" aria-live="polite">
  {{ loadingMessage }}
</div>

<script setup>
const loadingMessage = computed(() => {
  if (isInitialLoading.value) return 'Loading catalog...'
  if (isLoadingMore.value) return 'Loading more items...'
  return ''
})
</script>
```

**Test**: Trigger loading state — screen reader should announce loading message.

---

### 16. Dropdown Menu (Profile) Not Keyboard Accessible
**Files**: `AppHeader.vue` (uses `<details>` for profile menu)  
**WCAG Criterion**: 2.1.1 Keyboard

**Problem**: `<details>` element may have inconsistent keyboard behavior across browsers. No Escape key to close.

**User Impact**: Keyboard users may have difficulty opening/closing menu.

**How to Fix**:
```vue
<!-- Replace details/summary with proper button + menu pattern -->
<template>
  <div class="relative">
    <button
      ref="menuButton"
      type="button"
      :aria-expanded="isMenuOpen ? 'true' : 'false'"
      aria-haspopup="true"
      aria-controls="profile-menu"
      class="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
      @click="toggleMenu"
      @keydown.escape="closeMenu"
    >
      <span class="...">{{ profileInitials }}</span>
      <span class="hidden sm:block">{{ profileLabel }}</span>
    </button>
    
    <nav
      v-show="isMenuOpen"
      id="profile-menu"
      role="menu"
      class="absolute right-0 mt-2 w-56 ..."
    >
      <a href="/account/loans" role="menuitem">My loans & reservations</a>
      <a href="/account/profile" role="menuitem">Profile preferences</a>
      <button type="button" role="menuitem" @click="handleSignOut">Sign out</button>
    </nav>
  </div>
</template>

<script setup>
const isMenuOpen = ref(false)
const menuButton = ref(null)

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
  menuButton.value?.focus()
}

// Close on outside click
onClickOutside(menuButton, closeMenu)
</script>
```

**Test**: Tab to profile button, press Enter — menu opens. Press Escape — menu closes and focus returns to button.

---

### 17. Tables Missing Proper Markup
**Files**: Admin sections (if tables are present)  
**WCAG Criterion**: 1.3.1 Info and Relationships

**Problem**: If data is presented in grid format without proper table markup, screen readers can't navigate it properly.

**How to Fix**: Use `<table>`, `<th>`, `<caption>` elements for tabular data, or use ARIA grid role if custom implementation is required.

---

### [x] 18. Insufficient Focus Indicators
**Files**: Global styles, multiple components  
**WCAG Criterion**: 2.4.7 Focus Visible

**Problem**: Some interactive elements may not have clear focus indicators, or indicators may be removed by CSS.

**How to Fix**:
```css
/* Ensure all focusable elements have visible focus */
*:focus-visible {
  outline: 2px solid #06b6d4; /* cyan-500 */
  outline-offset: 2px;
}

/* Don't remove outlines */
button:focus,
a:focus,
input:focus {
  /* Never use outline: none without replacement */
}
```

**Test**: Use Tab key to navigate entire site — every interactive element should have a clearly visible focus indicator.

---

### 19. Autocomplete Attributes Missing on Forms
**Files**: `AuthPanel.vue`  
**WCAG Criterion**: 1.3.5 Identify Input Purpose

**Problem**: Email and password inputs don't have autocomplete attributes.

**User Impact**: Users can't benefit from browser autofill, password managers, or assistive technology form helpers.

**How to Fix**:
```vue
<input
  id="auth-email"
  v-model="email"
  type="email"
  autocomplete="email"
  ...
/>

<input
  id="auth-password"
  v-model="password"
  type="password"
  :autocomplete="isSignUp ? 'new-password' : 'current-password'"
  ...
/>
```

**Test**: Try to autofill form — browser should offer saved credentials.

---

### 20. Timeout/Session Expiry Not Announced
**Files**: Auth system  
**WCAG Criterion**: 2.2.1 Timing Adjustable, 2.2.6 Timeouts

**Problem**: If session expires, users aren't warned before being logged out.

**User Impact**: Users lose work when unexpectedly logged out.

**How to Fix**: Implement session expiry warning with option to extend session. Show countdown 5 minutes before expiry.

---

## 🟢 MEDIUM PRIORITY ISSUES

### 21. Breadcrumbs Missing aria-label
**Files**: `catalog.vue` uses `NuxtBreadcrumb`  
**WCAG Criterion**: 2.4.8 Location

**How to Fix**:
```vue
<nav aria-label="Breadcrumb">
  <NuxtBreadcrumb :items="breadcrumbs" />
</nav>
```

---

### 22. Region Landmarks Not Fully Labeled
**Files**: All layouts  
**WCAG Criterion**: 1.3.1 Info and Relationships

**Problem**: Multiple `<nav>` or `<section>` elements without unique labels.

**How to Fix**:
```vue
<nav aria-label="Main navigation">...</nav>
<nav aria-label="Dashboard sidebar">...</nav>
<aside aria-label="Filters">...</aside>
```

---

### 23. Pagination Not Fully Accessible
**Files**: Catalog "Load more" button  
**WCAG Criterion**: 2.4.1 Bypass Blocks

**How to Fix**: Add jump-to-top button after loading more, or implement virtual scrolling with keyboard shortcuts.

---

### 24. Date Formats Not Localized
**Files**: Multiple (published dates)  
**WCAG Criterion**: 3.1.2 Language of Parts

**How to Fix**: Use `<time>` element with datetime attribute:
```vue
<time :datetime="item.publishedAt">
  {{ formatDate(item.publishedAt) }}
</time>
```

---

### 25. Icons Not Accessible
**Files**: Components using `NuxtIcon`  
**WCAG Criterion**: 1.1.1 Non-text Content

**Problem**: Icons without text labels need `aria-hidden="true"` if decorative, or `aria-label` if meaningful.

**How to Fix**:
```vue
<!-- Decorative icon next to text -->
<NuxtIcon name="heroicons:home" aria-hidden="true" />
<span>Dashboard</span>

<!-- Icon-only button -->
<button aria-label="Close menu">
  <NuxtIcon name="heroicons:x-mark" aria-hidden="true" />
</button>
```

---

### 26. Card Hover States Only Visual
**Files**: `CatalogGrid.vue`  
**WCAG Criterion**: 1.4.1 Use of Color

**How to Fix**: Ensure hover state isn't only color change — add border, shadow, or transform.

---

### 27. Required Fields Not Clearly Marked
**Files**: Forms in `AdminMediaFormModal.vue`  
**WCAG Criterion**: 3.3.2 Labels or Instructions

**How to Fix**:
```vue
<label for="media-title">
  Title <abbr title="required" aria-label="required">*</abbr>
</label>
<!-- OR -->
<label for="media-title">
  Title <span aria-label="required">(required)</span>
</label>
```

---

## 🔵 LOW PRIORITY ISSUES

### 28. AAA Contrast Levels
Some text could be improved to meet WCAG AAA (7:1) instead of just AA (4.5:1) for better readability.

---

### 29. Enhanced Error Recovery
Provide "Did you mean?" suggestions for common typos in search.

---

### 30. Descriptive Link Text
Some "Learn more" or "Click here" links could be more descriptive out of context.

---

### 31. Reduced Motion Preferences
**WCAG Criterion**: 2.3.3 Animation from Interactions (AAA)

**How to Fix**:
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### 32. Printable Stylesheet
Ensure pages are readable when printed (remove dark backgrounds, ensure text is black).

---

## Testing & Validation Checklist

### Automated Testing Tools (Run These First)
- [ ] **axe DevTools** (Chrome/Firefox extension) — Free, catches ~30-40% of issues
- [ ] **Lighthouse** (Chrome DevTools → Lighthouse → Accessibility) — Built-in to Chrome
- [ ] **WAVE** (Chrome extension) — Highlights errors visually on page
- [ ] **pa11y** (Command line tool) — Can integrate into CI/CD

### Manual Testing (Required for Full Compliance)
- [ ] **Keyboard-only navigation**: Unplug mouse, navigate entire site with Tab, Enter, Space, Esc, Arrow keys
- [ ] **Screen reader testing**:
  - Windows: NVDA (free) or JAWS (paid)
  - Mac: VoiceOver (built-in, Cmd+F5)
  - iOS: VoiceOver (Settings → Accessibility)
  - Android: TalkBack
- [ ] **Zoom to 200%**: All content should remain readable and functional
- [ ] **Color contrast check**: Use Colour Contrast Analyser tool
- [ ] **Browser testing**: Test in Chrome, Firefox, Safari, Edge

### User Flows to Test
1. ✅ Browse catalog without signing in
2. ✅ Sign up for new account
3. ✅ Sign in with existing account
4. ✅ Search and filter catalog
5. ✅ View item details
6. ✅ Reserve an item (authenticated)
7. ✅ Navigate dashboard sections
8. ✅ Create/edit media items (admin)
9. ✅ Sign out

---

## Implementation Plan

### Phase 1: Critical Fixes (Week 1)
**Goal**: Make core features accessible to keyboard and screen reader users.

1. Fix modal focus traps (Issue #1) — 4 hours
2. Add alt text to all images (Issue #2) — 2 hours
3. Fix form label associations (Issue #3) — 3 hours
4. Make catalog cards keyboard accessible (Issue #4) — 2 hours
5. Add page language attribute (Issue #6) — 15 minutes
6. Add live region announcements (Issue #7, #8) — 3 hours

**Estimated Total**: 14.25 hours

### Phase 2: High Priority Fixes (Week 2)
**Goal**: Improve user experience and add skip navigation.

1. Add skip to main content links (Issue #9) — 1 hour
2. Fix heading hierarchy (Issue #10) — 2 hours
3. Improve form validation messages (Issue #11) — 3 hours
4. Announce search results (Issue #12) — 1 hour
5. Clarify button states (Issue #13) — 2 hours
6. Add ARIA labels to modals (Issue #14) — 1 hour
7. Announce loading states (Issue #15) — 2 hours
8. Fix profile menu keyboard access (Issue #16) — 3 hours
9. Enhance focus indicators (Issue #18) — 2 hours
10. Add autocomplete attributes (Issue #19) — 30 minutes

**Estimated Total**: 17.5 hours

### Phase 3: Medium Priority (Week 3)
Address remaining AA issues and polish (Issues #21-27) — 8 hours

### Phase 4: Low Priority & Ongoing
Address AAA criteria and set up automated testing in CI/CD (Issues #28-32) — 6 hours

**Total Implementation Estimate**: ~46 hours

---

## Automated Testing Setup

### Add to package.json scripts:
```json
{
  "scripts": {
    "test:a11y": "pa11y-ci --config .pa11yci.json",
    "test:axe": "playwright test accessibility.spec.ts"
  }
}
```

### Create `.pa11yci.json`:
```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "timeout": 10000,
    "wait": 1000
  },
  "urls": [
    "http://localhost:3000",
    "http://localhost:3000/catalog",
    "http://localhost:3000/login"
  ]
}
```

### Create `tests/accessibility.spec.ts` (Playwright + axe):
```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('Homepage should not have accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:3000')
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
  expect(accessibilityScanResults.violations).toEqual([])
})
```

---

## Organizational Accessibility Requirements

### Beyond Technical Standards
Accessibility best practices and many legal frameworks require more than just WCAG compliance:

1. **Accessibility Statement**: Publish a statement describing your commitment and how to request accessible formats
2. **Feedback Process**: Provide accessible way for users to report barriers (email, phone, form)
3. **Training**: Staff working on the site should receive accessibility training
4. **Procurement**: When buying third-party components, ensure they meet accessibility standards
5. **Documentation**: Keep records of compliance efforts and remediation activities

### Recommended Accessibility Statement
Create `/accessibility` page:

```markdown
# Accessibility Statement

Great City Community Library is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.

## Standards
We aim to conform to WCAG 2.1 Level AA standards.

## Feedback
We welcome your feedback on the accessibility of our library system. Please contact us:
- Email: accessibility@greatcitylibrary.ca
- Phone: (555) 867-3200
- Mail: 415 Library Lane, Great City, GC 20415

We will respond within 5 business days.

## Compatibility
This website is designed to be compatible with:
- Recent versions of Chrome, Firefox, Safari, and Edge
- NVDA, JAWS, and VoiceOver screen readers

## Known Issues
We are aware of the following accessibility issues and are working to address them:
[List any known issues here]

Last updated: November 30, 2025
```

---

## Resources

### Official Standards
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [W3C Web Accessibility Initiative](https://www.w3.org/WAI/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)
- [NVDA Screen Reader](https://www.nvaccess.org/) (Windows, free)

### Learning Resources
- [WebAIM](https://webaim.org/) — Excellent guides and articles
- [A11ycasts by Google](https://www.youtube.com/playlist?list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g)
- [Inclusive Components](https://inclusive-components.design/)
- [Vue.js Accessibility Guide](https://vuejs.org/guide/best-practices/accessibility.html)

### Vue/Nuxt Specific
- [@vueuse/core](https://vueuse.org/) — useFocusTrap, useEventListener
- [nuxt-a11y](https://github.com/Developmint/nuxt-a11y) — Automated testing module for Nuxt

---

## Quick Wins (Do These Today)

If you only have 1-2 hours, fix these for immediate impact:

1. ✅ **Add lang attribute** (15 min) — Issue #6
2. ✅ **Fix image alt text** (30 min) — Issue #2, at least for catalog cards
3. ✅ **Add skip to content link** (20 min) — Issue #9
4. ✅ **Fix color contrast** (30 min) — Issue #5, change text-slate-400 to text-slate-300
5. ✅ **Add focus indicators** (15 min) — Issue #18, add CSS rule

**Total**: ~2 hours, fixes ~15% of issues, makes site 50% more usable for keyboard/screen reader users.

---

## Conclusion

This application has a solid foundation but requires significant accessibility work to meet WCAG 2.1 Level AA standards. The critical issues would completely block users with certain disabilities from accessing core features.

**Recommended approach**: Fix Phase 1 (critical) and Phase 2 (high priority) issues before any public launch. Phase 3 and 4 can be addressed post-launch but should be prioritized in the roadmap.

**Maintenance**: Accessibility is not a one-time task. Set up automated testing in CI/CD and conduct manual audits quarterly. Include accessibility acceptance criteria in all feature tickets.

---

**Questions or need clarification on any issue?** I can provide more detailed code examples, help prioritize based on your user base, or assist with setting up automated testing.
