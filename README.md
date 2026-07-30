# FaultyMart QA Playground

A deliberately imperfect React storefront for testing IDS Agent's
commit-to-test-card workflow. The commit history contains a clean application
shell followed by the full feature surface and its seeded defects.

## Local setup

```bash
npm install
npm run dev
```

The project is intentionally unsafe as a product but safe as a test fixture:
it uses mock data only, has no backend, accepts no real payments, and contains
no credentials.

## Suggested IDS Agent run

1. Point IDS Agent at the latest feature commit.
2. Use [`TESTING_BRIEF.md`](./TESTING_BRIEF.md) as the expected behavior.
3. Generate test cards for catalog, cart, checkout, orders, accessibility, and
   responsive behavior.
4. Run the cards before opening [`BUG_CATALOG.md`](./BUG_CATALOG.md).

The ground-truth catalog contains 14 seeded defects. Some are visible through
ordinary interaction; others require keyboard, repeated-action, state
persistence, or narrow-viewport testing.
