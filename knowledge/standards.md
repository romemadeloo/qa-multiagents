# QA standards

These are starter workspace defaults. Record ticket-specific exit criteria in
the test plan and QA owner changes in decisions.md.

## Traceability and execution

Use <ticket>-AC-01 for criteria, <ticket>-TC-001 for cases, and
<ticket>-BUG-001 for defects. Trace each criterion to cases and actual results.
Cases start NOT_RUN. Results use PASS, FAIL, BLOCKED, NOT_RUN, or SKIPPED.
Record executor, date/time, environment, build, browser/device, actor, data,
expected/actual outcome, and evidence references. SKIPPED is not PASS.
Keep original failures when recording successful retests. Passing on retry
is flaky evidence and needs assessment.

## Severity and priority

| Severity | Impact |
| --- | --- |
| S1 Critical | Core service unavailable, major data loss, or severe access violation |
| S2 Major | Important workflow fails with no acceptable workaround |
| S3 Moderate | Limited impact with a practical workaround |
| S4 Minor | Cosmetic or low-impact issue |

Severity describes observed impact. Priority is the business scheduling
decision; suggest P0/P1/P2/P3 with rationale, then retain the owner's decision.
S1/S2 defects block release by default. Smaller defects may also block when
they violate required acceptance criteria. Deferral requires a named owner's
explicit decision and recorded residual risk.

## Automation

Use TypeScript, @playwright/test, role/label/test-ID locators, independent
fixtures, and web-first assertions. Avoid fixed waits and test order coupling.
Use tags such as @smoke and @regression, plus stable case IDs in test titles.
Use APP_TARGET to choose storefront/admin. Review credentials and actor scope
before selecting authenticated storage state. Preserve failures with traces,
screenshots, and video. Add visual baselines only after the expected design is
confirmed; review changes rather than automatically accepting new snapshots.

Wait for real application readiness, not only rendered markup, before the first
interaction; on the Nuxt storefront see KNOW-AUTO-002. A `toBeVisible()` pass
proves presence only; to claim readability of collapsible content, expand it
and assert full in-viewport ratio (KNOW-AUTO-003). Treat development-only UI as
optional (KNOW-ENV-003). Bind every evidence run to the verified served build
id (KNOW-ENV-002). These conventions are derived from GLOP-1478 observations
(2026-10-19); the QA owner may revise them.

## Release assessment

READY requires identified candidate build/environment; reviewed requirements
and required designs; relevant current-build evidence for all confirmed ACs;
planned manual, browser, permission, and regression coverage; and verified
closure of blocking defects. Explain every omitted required check and exception.
Use NOT_READY for demonstrated blocking failures. Use INSUFFICIENT_EVIDENCE
when requirements or necessary results are missing. A baseline URL check and
the demo suite cannot establish feature readiness. The QA owner records the
final release decision; the reviewer records a recommendation.
