# Regression knowledge

Record reusable lessons with their actual run scope; observed implementation
details must be rechecked when the application changes.

For each lesson record: ID, affected feature, failure mode, impacted surfaces
and roles, related ticket/defect/case IDs, source evidence, environment/build,
review date, and the regression check that would detect recurrence. Label an
observed failure separately from a confirmed business rule.

ID: KNOW-AUTO-001  
Lesson: Await the UI state produced by the preceding action before navigating
again. In GLOP-1478 R1 TC-005, Add already opened the cart preview; a redundant
header-cart click then timed out because the overlay intercepted it. This was
HARN-01, a harness synchronization issue, without a demonstrated product defect.
The correction awaited the auto-opened preview using a web-first visibility
assertion; it retained count, quantity, zero item-price, duplicate-retention and
cleanup checks without forced clicks or fixed sleeps.  
Affected feature/surface/actor: Standalone sample pack, public storefront
product page and cart preview, fresh anonymous Chromium contexts at 1440x900.  
Scope: Observed on the configured development storefront in qa.config.json;
owner-supplied candidate Ms-static-9, build 1026-20261016, commit 0baee185. The
served build was not independently verified. Current cart auto-opening, runtime
readiness marker and DEV toolbar handling are implementation details, not
immutable business rules. Recheck them when reusing this flow.  
Confidence: observed  
Regression check: Use an isolated anonymous context; add one pack, await the
visible preview and assert exactly one item with quantity one and zero KRW item
price. For a sequential duplicate attempt, assert the guard and retention of
the sole original pack. Explicitly remove the pack and assert both zero cart
items and empty-cart text. These checks passed in R2; R1's failed attempt remains
archived rather than retrospectively passed.  
Related IDs: GLOP-1478-TC-005, GLOP-1478-TC-006; HARN-01.  
Source: [Execution and preserved attempt history](../../tickets/GLOP-1478/04-execution.md),
[harness classification](../../tickets/GLOP-1478/05-defects.md),
[automation notes](../../tickets/GLOP-1478/03-automation.md),
[R1 intercepted-click evidence](../../tickets/GLOP-1478/evidence/2026-10-19T01-38-51-451Z-storefront-f61d6b01/test-results/sample-pack-glop-1478-GLOP-33fe2--standalone-pack-regression-chromium/error-context.md),
[R2 actual results and observations](../../tickets/GLOP-1478/evidence/2026-10-19T01-41-36-600Z-storefront-df2cb026/execution-inspection.json),
and [R2 executed source](../../tickets/GLOP-1478/evidence/2026-10-19T01-41-36-600Z-storefront-df2cb026/executed-test-source.ts).  
Reviewed: 2026-10-19  
Limits: R2 passed five selected cases with no skips or retries. This establishes
limited anonymous public/cart behavior and harness correction, without full
ticket acceptance coverage. It does not validate account/address eligibility,
shipping, authoritative custom prices, order-level bundle counts or shipments.
Mobile policy and rapid-duplicate cases were not part of R1/R2; no results for
them are asserted by this entry.  
Update 2026-10-19: R1/R2 ran on Nuxt f9ef1c69, later replaced (KNOW-ENV-002).
The await-the-auto-opened-preview lesson stands. Its readiness detail is
superseded: the `__vue_app__` marker used in R1/R2 is insufficient; see
KNOW-AUTO-002. DEV toolbar handling is now KNOW-ENV-003.

ID: KNOW-AUTO-002  
Lesson: On the storefront sample-pack page, the server-rendered 장바구니 담기
control (`sample-pack-hero-cart-button`) is visible and enabled before Vue
hydration finishes, and clicks in that window are silently discarded: no cart
change, preview, message or disabled/loading state. Playwright actionability
does not protect against this, and the presence of
`#__nuxt.__vue_app__` alone is not a sufficient readiness signal. Wait for
`document.getElementById('__nuxt').__vue_app__.$nuxt.isHydrating === false`
(read-only, bounded timeout, no fixed sleep) before the first interaction.
This wait keeps tests deterministic; it does not fix or hide the product
behaviour, which is tracked as GLOP-1478-BUG-002 (OPEN, S3).  
Affected feature/surface/actor: Standalone sample pack add control, public
/kr/sample-pack, anonymous fresh contexts; Chromium, Firefox and WebKit at
1440x900.  
Failure mode and frequency: Nuxt 363542d7, early clicks lost 4/4 with only
`__vue_app__` present, and 10/10 registered after `isHydrating === false`.
Nuxt a8322d8d, early clicks lost 11/11 across three engines; post-hydration
control clicks registered 11/11. Measured visible-to-hydrated window 2.5-5.8 s
unthrottled and about 17.3-17.5 s with emulated slow network and 4x CPU.
Whether other server-rendered controls lose clicks was not established.  
Scope: Implementation detail of those two development builds. `isHydrating` is
a Nuxt runtime internal; recheck it after framework or app changes. The
expected product behaviour for pre-hydration clicks is not a confirmed
requirement; it remains an open defect/owner decision in the ticket.  
Confidence: observed  
Regression check: Cart helpers wait for hydration as above. To retest the
product behaviour, rerun the BUG-002 pre-hydration probe in three engines,
unthrottled and throttled, on an owner-identified build.  
Related IDs: GLOP-1478-BUG-002, HARN-02, GLOP-1478-TC-005/006/008.  
Source: [BUG-002 and HARN-02](../../tickets/GLOP-1478/05-defects.md),
[prehydration-add-probe.json](../../tickets/GLOP-1478/evidence/defects/GLOP-1478-BUG-002/prehydration-add-probe.json),
[inspection notes](../../tickets/GLOP-1478/sources/automation/tc004-tc008-inspection-notes.md),
[03-automation.md HARN-02](../../tickets/GLOP-1478/03-automation.md).  
Reviewed: 2026-10-19

ID: KNOW-AUTO-003  
Lesson: Playwright `toBeVisible()` passes for text inside a collapsed ancestor
with 0 px height and overflow hidden (the collapsed FAQ answer panel, text at
opacity 0), because visibility ignores ancestor clipping. Such a pass proves
DOM/accessibility presence, not readability. In WebKit, `innerText` of that
collapsed text returned `""` (Chromium and Firefox returned the text), so
captured text attachments differ by engine. To claim readability, expand the
panel through the UI first, then assert `toBeInViewport({ ratio: 1 })` (as
TC-004 does) or an equivalent readable-in-viewport check.  
Affected feature/surface/actor: FAQ accordion on /kr/sample-pack, any
collapsible content; anonymous public page; Chromium, Firefox, WebKit.  
Scope: Observed with Playwright 1.64.1 on Nuxt 363542d7 (R4 supplementary
probe: checkVisibility() false, intersection ratio 0 in all three engines) and
a8322d8d (R5/R6 WebKit `"faq": ""`). The collapsed-panel styling is an
implementation detail. Whether TC-001 itself is strengthened is the TEST-01
decision, still open in the ticket.  
Confidence: observed  
Regression check: For collapsible content, assert the expanded state and full
in-viewport ratio; label presence-only assertions as presence in case results.  
Related IDs: TEST-01, GLOP-1478-TC-001, GLOP-1478-TC-004.  
Source: [TEST-01](../../tickets/GLOP-1478/05-defects.md),
[R4 supplementary-faq-collapsed-probe.json](../../tickets/GLOP-1478/evidence/2026-10-19T05-21-14-336Z-storefront-b3c423cb/supplementary-faq-collapsed-probe.json),
[R5/R6 results](../../tickets/GLOP-1478/04-execution.md),
[inspection notes](../../tickets/GLOP-1478/sources/automation/tc004-tc008-inspection-notes.md).  
Reviewed: 2026-10-19
