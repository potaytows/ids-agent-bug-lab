# FaultyMart QA Playground

A deliberately imperfect React storefront for testing IDS Agent's
commit-to-test-card workflow. The commit history contains a clean application
shell followed by the full feature surface and its seeded defects.

## Local setup

```bash
npm install
npm run db:up
npm run dev
```

Docker Desktop must be running before `npm run db:up`. FaultyMart starts at
`http://127.0.0.1:4173` and its local API starts at
`http://127.0.0.1:8787`.

The project uses a local MySQL test database for products, orders, and order
items. It accepts no real payments or personal data. The committed credentials
are deliberately local-only defaults, and MySQL is bound to `127.0.0.1` so it
is not exposed to the local network.

## IDS/Coco database access

Run the following command to print the read-only connection string:

```bash
npm run db:connection
```

The `ids_reader` account has `SELECT` access to the `faultymart` database and
cannot modify application data. Its connection string disables TLS for
compatibility with the native Coco daemon's current SQLx build; MySQL remains
bound to this computer only. Useful verification tables are:

- `products`
- `orders`
- `order_items`

Use the application account only through the local API. Never reuse the demo
passwords or Docker configuration in a production environment.

## Suggested IDS Agent run

1. Point IDS Agent at the latest feature commit.
2. Use [`TESTING_BRIEF.md`](./TESTING_BRIEF.md) as the expected behavior.
3. Generate test cards for catalog, cart, checkout, orders, MySQL verification,
   accessibility, and responsive behavior.
4. Run the cards before opening [`BUG_CATALOG.md`](./BUG_CATALOG.md).

The ground-truth catalog contains 14 seeded defects. Some are visible through
ordinary interaction; others require keyboard, repeated-action, state
persistence, or narrow-viewport testing.
