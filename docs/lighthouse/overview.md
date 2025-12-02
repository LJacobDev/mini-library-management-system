# Lighthouse & Core Web Vitals Overview

## What is Lighthouse?

Lighthouse is an open-source automated tool from Google that audits web pages across five categories:

- **Performance** — includes Core Web Vitals (LCP, CLS, INP/TBT)
- **Accessibility** — WCAG-aligned checks
- **Best Practices** — security, modern APIs, console errors
- **SEO** — crawlability, meta tags, structured data
- **PWA** — progressive web app readiness (optional)

---

## Core Web Vitals Explained

| Metric | What it measures | Good threshold |
|--------|------------------|----------------|
| **LCP** (Largest Contentful Paint) | Perceived load speed — when main content is visible | ≤ 2.5 s |
| **CLS** (Cumulative Layout Shift) | Visual stability — unexpected layout movement | ≤ 0.1 |
| **INP** (Interaction to Next Paint) | Responsiveness — delay after user interaction | ≤ 200 ms |
| **TBT** (Total Blocking Time) | Main-thread blocking (lab proxy for INP) | ≤ 200 ms |

---

## Where to Run Lighthouse

| Method | Best for | Notes |
|--------|----------|-------|
| **Chrome DevTools → Lighthouse panel** | Quick interactive runs | Easiest first-time use |
| **Lighthouse CLI** (`npx lighthouse`) | Repeatable local/CI runs | Outputs HTML/JSON |
| **Lighthouse CI (lhci)** | Automated PR gating | GitHub Action integration |
| **Unlighthouse** | Site-wide crawl + audit | Wraps Lighthouse for all routes |
| **PageSpeed Insights / CrUX** | Field (real-user) data | Use API for production monitoring |

---

## Lab Data vs Field Data

- **Lab data** (Lighthouse CLI/DevTools) — deterministic, simulated environment. Good for debugging.
- **Field data** (CrUX / PageSpeed Insights) — aggregated real-user metrics. Reflects actual user experience across browsers/devices.

---

## Related Tools Comparison

| Tool | Scope | Data type | Use case |
|------|-------|-----------|----------|
| **Lighthouse** | Single page | Lab | Deep single-page analysis |
| **Web Vitals Extension** | Single page | Real-time (your session) | Quick spot-check while browsing |
| **Unlighthouse** | Entire site (crawl) | Lab (batched) | Site-wide audit before release |

### Why Unlighthouse?

Lighthouse only runs on one URL per invocation. Unlighthouse auto-crawls your site, queues Lighthouse runs for every discovered route, and produces a unified dashboard ranking all pages by score.

---

## Browser Compatibility

- Lighthouse runs on **Chromium-based browsers** only (Chrome, Edge, Brave, etc.).
- It is **not available in Firefox** DevTools.
- For Firefox-specific testing, use:
  - WebPageTest (supports Firefox)
  - `web-vitals` JS library in-page
  - Firefox DevTools Performance panel (manual profiling)

---

## Quick CLI Commands

### Single-page Lighthouse run

```bash
# Run against local dev server, output HTML report
npx lighthouse http://localhost:3000 --output html --output-path ./docs/lighthouse/reports/report.html --chrome-flags="--headless"
```

### Unlighthouse site-wide scan

```bash
# Crawl and audit entire site
npx unlighthouse --site http://localhost:3000
# Opens dashboard at http://localhost:5678
```

---

## Common Fixes for Core Web Vitals

### LCP (Largest Contentful Paint)

- Optimize server response time (SSR caching)
- Compress/resize images, use modern formats (WebP/AVIF)
- Preload hero image
- Reduce render-blocking CSS/JS

### CLS (Cumulative Layout Shift)

- Set explicit `width`/`height` or `aspect-ratio` on images/video
- Reserve space for ads/embeds
- Avoid inserting content above existing content

### INP / TBT (Responsiveness)

- Break up long JavaScript tasks
- Code-split and lazy-load non-critical scripts
- Use web workers for heavy computation
- Reduce main-thread work

### General

- Enable compression (gzip/brotli)
- Use HTTP/2 or HTTP/3
- Serve assets via CDN
- Preconnect to critical origins

---

## Audit Plan for This Application

### Phase 1: Manual Single-Page Audits (Current)

**Goal:** Establish baselines and fix critical issues on key pages.

**Pages to audit:**

| Priority | Route | Notes |
|----------|-------|-------|
| 1 | `/` | Landing page — first impression |
| 2 | `/catalog` | Main content page — likely heaviest |
| 3 | `/login` | Auth flow entry |
| 4 | `/dashboard` | Authenticated home |
| 5 | `/dashboard/*` | Sub-routes as needed |
| 6 | `/status` | Lightweight — sanity check |

**Workflow:**

1. Start dev server: `npm run dev`
2. Run Lighthouse via DevTools or CLI
3. Save report to `docs/lighthouse/reports/<route>-<date>.html`
4. Log key scores in tracking table below
5. Address top 2–3 opportunities per page
6. Re-run and compare

### Phase 2: Unlighthouse Site-Wide Scans

**Goal:** Catch regressions across all routes automatically.

**Setup steps:**

1. Install Unlighthouse (or use npx)
2. Add npm script:
   ```json
   "scripts": {
     "lighthouse:site": "unlighthouse --site http://localhost:3000"
   }
   ```
3. Run before major releases or PRs
4. Export reports to `docs/lighthouse/reports/unlighthouse-<date>/`

### Phase 3: CI Integration (Future)

**Goal:** Automated Lighthouse checks on every PR.

**Options:**

- **Lighthouse CI (lhci)** — set budgets, fail PR if scores drop
- **Unlighthouse CI mode** — `unlighthouse-ci` for headless runs

**Example GitHub Action (lhci):**

```yaml
name: Lighthouse CI

on: [push, pull_request]

jobs:
  lhci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npx @lhci/cli autorun
```

---

## Score Tracking Table

Use this table to track progress over time.

| Date | Route | Perf | A11y | Best Practices | SEO | Notes |
|------|-------|------|------|----------------|-----|-------|
| YYYY-MM-DD | `/` | — | — | — | — | Baseline |
| YYYY-MM-DD | `/catalog` | — | — | — | — | Baseline |

---

## Reports Directory Structure

```
docs/lighthouse/
├── overview.md              # This file
└── reports/
    ├── index-2025-12-01.html
    ├── catalog-2025-12-01.html
    └── unlighthouse-2025-12-01/
        └── ... (auto-generated)
```

---

## Resources

- [Lighthouse documentation](https://developer.chrome.com/docs/lighthouse/)
- [web.dev Core Web Vitals](https://web.dev/vitals/)
- [Unlighthouse](https://unlighthouse.dev/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [PageSpeed Insights](https://pagespeed.web.dev/)
