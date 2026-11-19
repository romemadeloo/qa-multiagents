# Musticker tests

Keep real application tests here, organized by feature as the suite grows.
The initial BASELINE-001 test checks the public entry point only. Add feature
cases after reviewing ticket requirements and the real UI. Include the case ID
in each test title, for example `[GLOP-1478-TC-001] ... @smoke`.

Import `test` and `expect` from `fixtures.ts` (as `./fixtures.js`), never from
`@playwright/test`; `npm run check` enforces this. The fixture aborts requests to
production hosts and fails the test on any navigation, API call, or write there.
It also provides `apps` (the ticket's storefront/admin/api URLs), `adminPage` (a
page on the admin server), and `api` (a request context on the API server).

Use `getByRole`, `getByLabel`, or stable test IDs. Extract a page object only
when repeated application behavior justifies it. Keep credentials in `.env`
or another ignored local secret store and auth state in `playwright/.auth/`.
Document roles, data setup, and cleanup without storing credentials in knowledge.
