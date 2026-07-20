# Design QA

## Market Explorer

- [x] Desktop layout verified at 1440px with stable two-column dashboard composition.
- [x] Mobile layout verified at 390px with no horizontal page overflow.
- [x] Role, level, region, work model, and organization type controls fit their containers.
- [x] Work-model and organization-type cuts display sample size and confidence context.
- [x] Empty published-cut combinations fall back visibly instead of presenting invented precision.
- [x] Operational typography remains compact and readable across light and dark surfaces.

## Data Operations

- [x] Existing live survey records and processing tables remain available.
- [x] CSV, API, and webhook intake paths are represented in the v1 source workflow.
- [x] Organization matching supports search, row selection, bulk type assignment, and approval interactions.
- [x] UTMB Health demonstrates the account-alias relationship to University of Texas Medical Branch.
- [x] Organization classification follows BloomOS alias match, deterministic rule, then manual review.

## Verification

- [x] `npm run typecheck`
- [x] `npm run build`
- [x] Desktop Market Explorer visually inspected at 1440px.
- [x] Mobile Market Explorer visually inspected at 390px.
- [x] Organization matching queue visually inspected at 1440px.
