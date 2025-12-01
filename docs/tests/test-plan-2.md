# Test Plan: Comprehensive Testing Strategy

## Testing Framework Strategy

### Vitest (Unit, Integration, Component Tests)
- **Unit tests**: Pure functions, utilities, business logic
- **Integration tests**: Composables with mocked APIs, module interactions
- **Component tests**: Vue components with Vue Test Utils
- **Snapshot tests**: Component output stability
- **API route tests**: Server endpoints with mocked database

### Cypress (End-to-End Tests)
- **E2E flows**: Full user journeys across pages
- **Visual regression**: Screenshots and visual diffs
- **Cross-browser testing**: Chrome, Firefox, Edge
- **Network testing**: Real API interactions and error states
- **Authentication flows**: Login, logout, session management

---

## Phase 1: Critical Foundation (Start Here)

### Priority 1A: Pure Utility Functions (Vitest Unit Tests)
**Rationale**: Deterministic, fast, teach fundamentals, high ROI

1. **`utils/sanitizeText.ts`** ⭐ **START HERE**
   - Empty/null/undefined inputs
   - HTML/script injection attempts
   - Special characters, unicode, emojis
   - Whitespace handling
   - Very long strings
   - Idempotence (double sanitization)

2. **`utils/pagination.ts`**
   - Page boundary calculations
   - Invalid page numbers (negative, zero, beyond max)
   - Edge cases: empty results, single item, exact page size
   - Offset/limit calculations

3. **`utils/searchFilters.ts`**
   - Filter parsing and validation
   - Empty filters
   - Malformed filter objects
   - Case sensitivity
   - Multiple filter combinations

### Priority 1B: Critical Composables (Vitest Integration Tests)
**Rationale**: Core business logic, high usage, complex state

4. **`composables/useCatalogData.ts`**
   - Mock API responses (success, error, empty)
   - Loading states
   - Pagination integration
   - Search filter application
   - Error handling and retry logic

5. **`composables/useSupabaseAuth.ts`**
   - Mock Supabase client
   - Login success/failure
   - Session persistence
   - Logout cleanup
   - Token refresh handling

### Priority 1C: Server API Routes (Vitest Integration Tests)
**Rationale**: Backend contract, data integrity, error responses

6. **`server/api/**/*.ts`** (pick 2-3 most critical endpoints first)
   - Request validation
   - Database query mocking
   - Response structure
   - Error status codes (400, 401, 404, 500)
   - Authorization checks

---

## Phase 2: Component Coverage (After Phase 1)

### Priority 2A: Core UI Components (Vitest Component Tests)
**Rationale**: User-facing, reusable, frequently changed

7. **`components/catalog/CatalogList.vue`**
   - Renders items correctly
   - Empty state display
   - Loading spinner behavior
   - Pagination controls interaction
   - Search integration

8. **`components/catalog/MediaCard.vue`**
   - Props rendering
   - Event emission (click, favorite)
   - Image fallback handling
   - Accessibility attributes

9. **`components/admin/MediaForm.vue`**
   - Form validation
   - Submit behavior
   - Error display
   - Field clearing/reset

### Priority 2B: Layout and Navigation (Vitest Component Tests)
10. **`components/AppHeader.vue`**
    - Navigation links
    - Auth state display
    - Responsive behavior (can test with viewport mocking)

11. **`layouts/dashboard.vue`**
    - Slot content rendering
    - Auth middleware integration (mock)
    - Nested routing

---

## Phase 3: End-to-End Critical Flows (Cypress)

### Priority 3A: Core User Journeys
**Rationale**: Validate full stack integration, catch regressions

12. **Guest Browse Flow**
    - Visit homepage
    - Navigate to catalog
    - Search for media
    - Filter results
    - View media detail
    - Check no auth-required features visible

13. **Admin Login Flow**
    - Navigate to login
    - Enter credentials
    - Successful login redirect
    - Dashboard access
    - Session persistence (refresh page)

14. **Admin Media Management**
    - Login as admin
    - Navigate to admin panel
    - Create new media item
    - Edit existing item
    - Delete item
    - Verify changes in catalog

15. **Search and Filter Flow**
    - Search by title
    - Apply multiple filters
    - Clear filters
    - Pagination through results
    - Verify result counts

---

## Phase 4: Edge Cases and Robustness

### Priority 4A: Error Handling (Vitest + Cypress)
16. **Network Failures**
    - API timeout simulation
    - 500 server errors
    - Network offline detection
    - Retry mechanisms

17. **Validation Boundaries**
    - Form validation edge cases
    - Maximum length inputs
    - Special character handling
    - SQL injection attempts (server-side)

### Priority 4B: Performance and Stress (Vitest Benchmarks)
18. **Pagination Performance**
    - Large dataset handling (1000+ items)
    - Query optimization verification

19. **Search Performance**
    - Complex filter combinations
    - Large text search

---

## Phase 5: Snapshot and Visual Regression

### Priority 5A: Component Snapshots (Vitest)
20. **Key Components**
    - MediaCard with various props
    - CatalogList states (empty, loading, error, full)
    - Forms in different validation states
    - **Rationale**: Catch unintended UI changes

### Priority 5B: Visual Regression (Cypress)
21. **Critical Pages**
    - Homepage
    - Catalog page (with data)
    - Admin dashboard
    - Login page
    - **Rationale**: Detect CSS/layout regressions

---

## What NOT to Test (Low Priority / Skip)

### Skip or Deprioritize:
- **Third-party library internals**: Supabase client, Nuxt framework code (trust their tests)
- **Generated code**: Auto-generated types, build artifacts
- **Simple pass-through functions**: Wrappers with no logic
- **Styling-only components**: Pure presentational components with no logic (use visual tests only)
- **Experimental features**: Code marked as WIP or experimental
- **Mock implementations**: Test mocks themselves (focus on production code)

### Test Minimally:
- **Static content pages**: Pages with no dynamic behavior
- **Configuration files**: nuxt.config.ts, tsconfig.json (validate once, not repeatedly)
- **Simple getter/setter composables**: No complex logic to verify

---

## Coverage Goals

### Phase 1-2 Target: 60-70% Coverage
- All utility functions: 100%
- Critical composables: 80%+
- Server API routes: 80%+
- Core components: 60%+

### Phase 3-4 Target: 80%+ Coverage
- E2E flows: All critical user journeys
- Error paths: Major error scenarios
- Edge cases: Identified boundary conditions

### Final Target: 85-90% Coverage
- Comprehensive unit + integration + E2E
- Focus on critical paths, not 100% for its own sake
- Balance coverage with test maintenance burden

---

## Test Execution Strategy

### Local Development
```bash
# Watch mode for unit tests during development
npm run test:unit:watch

# Run specific test file
npm run test:unit -- sanitizeText.test.ts

# Component tests with UI
npm run test:unit -- --ui

# E2E in headed mode (watch browser)
npm run test:e2e -- --headed
```

### CI/CD Pipeline
```bash
# Fast feedback: Unit tests first (fail fast)
npm run test:unit -- --coverage

# Then integration tests
npm run test:integration

# Finally E2E (parallel across browsers)
npm run test:e2e -- --parallel

# Nightly: Visual regression + performance
npm run test:visual
npm run test:perf
```

---

## Success Metrics

1. **Phase 1 Complete**: Can confidently refactor utils and composables
2. **Phase 2 Complete**: Can modify components without breaking UI
3. **Phase 3 Complete**: Can deploy knowing critical flows work
4. **Phase 4 Complete**: App handles errors gracefully
5. **Phase 5 Complete**: Visual changes are intentional

---

## Next Steps (Immediate)

1. ✅ **Install Vitest**: `npm install -D vitest @vue/test-utils jsdom`
2. ✅ **Create first test**: `tests/unit/utils/sanitizeText.test.ts`
3. ✅ **Verify test runs**: `npm run test:unit`
4. ✅ **Add coverage reporting**: Configure vitest.config.ts
5. 🔄 **Repeat pattern**: Apply to pagination.ts, then composables
6. 🔄 **Install Cypress**: After Phase 1 complete
7. 🔄 **Create first E2E**: Guest browse flow

---
