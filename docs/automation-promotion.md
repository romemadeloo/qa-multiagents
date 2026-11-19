# Review automation after ticket completion

The coordinator dispatches `qa-automation-reviewer` after the QA owner records
completion and the ticket status is done/completed/closed. This phase assesses
regression value and adapts generated tests to the existing main Playwright
suite. It does not decide whether the feature can be released.

## Supply both repositories

In this workstation the source is
`C:\Users\Windows\qa-workspace\multi-agents` and the main suite is
`C:\Users\Windows\qa-workspace\musticker-playwright`. Other QA users supply
their own absolute paths. Set the `QA_AUTOMATION_REPO` environment variable or
pass the path in the coordinator task.

Give the reviewer the ticket's handoff, confirmed ACs/cases, generated specs,
run/retest evidence, source-to-destination write assignments, saved dev servers
and verified served build. Do not change a ticket to done simply to run review.
Current active tickets remain in their existing phases.

## What the reviewer does

1. Confirm completion and read actual destination conventions and neighboring
   tests before making a recommendation.
2. Decide which cases add durable business coverage; reject duplicate,
   baseline-only or temporary scaffolding.
3. Map ticket AC/TC IDs to the destination's module IDs, fixtures and POM methods.
   Reuse existing methods; extend the POM only for missing behavior. For the
   current main suite, reuse `tests/fixtures/e2e-test.ts` / `admin-test.ts`,
   `tests/pom/`, shared data and the `.js` import convention.
4. Adapt only assigned local destination files. If the session cannot write
   them, prepare `../tickets/<ID>/promotion/staged/` and scoped patches instead.
   Staged code is not integrated code.
5. Validate typecheck/lint, discovery, three consecutive clean runs without
   retries on the same dev build, and impacted regression for shared changes.
6. Write `../tickets/<ID>/08-automation-review.md` from
   `templates/automation-review.md`. Keep evidence, diffs, dependencies and
   per-candidate verdicts traceable. Human promotion / PR decision stays pending.

Prepare the complete bundle described in the main suite's `docs/PROMOTION.md`:
`promotion/manifest.json` and `promotion/files/` mirroring target spec/POM/helper
paths. Stage it under `promotions/<ID>/` in the main repo.
Run `npm run promotion:validate -- promotions/<ID>` there; it validates an isolated
overlay and affected regression. `npm run promotion:apply -- promotions/<ID>`
requires a matching successful report and unchanged destination. The stage/apply
commands never commit, push or merge, and unexecuted gates remain blocked.

The main suite can default to production. Bind the ticket's exact dev servers
explicitly, inspect how the suite resolves storefront/API/admin URLs and locale
paths, and do not run `test:prod:*` or accept a production fallback. Do not
weaken destination safeguards or choose another dev server to bypass a fixture
restriction. Missing access or validation means BLOCKED, not a fabricated pass.

## Dispatch prompt

```text
The QA owner confirmed <TICKET> is complete; use its recorded status and handoff
as the completion evidence. Delegate to qa-automation-reviewer.
Source workspace: <absolute multi-agent repo>
Main Playwright repo: <absolute main suite repo>
Source specs/helpers: <paths from 03-automation.md>
Dev environment and served build: <ticket.json environment + verified build>
Exclusive destination write paths: <specific specs/POM/helpers assigned here>
Own ../tickets/<TICKET>/08-automation-review.md and promotion/ staging.
Assess reusable value against existing coverage, adapt qualified cases to the
main suite's fixtures/POM/IDs, preserve source and unrelated dirty files, and
validate the adapted result. Return recommendations and next actions; leave
ticket state, commits, publishing and merge decisions to their owners.
```

If the session cannot write to the main suite, the reviewer stages adaptations
under the ticket folder and reports the write limits; do not bypass permission
restrictions. No automatic ticket watcher, model run, commit, push or merge is installed by
registering this role.
