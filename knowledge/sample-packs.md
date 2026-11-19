# Sample packs and custom samples

Entries KNOW-SAMPLE-001 to 005 preserve requirements reviewed for GLOP-1478. They describe
expected mechanics, not observed implementation or passing tests. The QA owner
supplied a ticket excerpt; live Jira details were not retrieved. The referenced
public document and saved Figma text were reviewed from the ticket's source
artifacts. Source revisions are unknown; confirm currency before reuse on a
later ticket. The owner identifies storefront candidate Ms-static-9, commit
0baee185, build 1026-20261016; this is not UI verification of the served build.
The admin candidate version remains unknown. Candidate identification supplies
no feature test results.

Source references used below:

- SRC-JIRA-01: [QA-owner ticket excerpt](../../tickets/GLOP-1478/sources/jira/qa-owner-ticket-excerpt-2026-10-19.md), received 2026-10-19; associated with [GLOP-1478](https://glophics-team-tejd16ze.atlassian.net/browse/GLOP-1478), without live metadata verification.
- SRC-OWNER-01: [QA-owner clarifications](../../tickets/GLOP-1478/sources/jira/qa-owner-clarifications-2026-10-19.md), received/reviewed 2026-10-19; controlling eligibility decision and owner-supplied storefront candidate identification.
- SRC-DOC-01: [Saved reference export](../../tickets/GLOP-1478/sources/docs/reference-export.txt) from the [referenced mechanics document](https://docs.google.com/document/d/1hsJ5y5_GwKRs_tVexj1a9EXe2w5SBkFu488WlfHjy8E/edit?tab=t.azig1uob0eq6), retrieved/reviewed 2026-10-19.
- SRC-FIGMA-01: [Saved exact Readme text](../../tickets/GLOP-1478/sources/figma/readme-exact.md) from [Figma node 2:69](https://www.figma.com/design/Dy8MjPAPKVR9agxoogUzW4/Free-Sample-Pack---Custom-Samples?node-id=2-69), retrieved/reviewed 2026-10-19.

ID: KNOW-SAMPLE-001  
Fact: A custom sample's 1-quantity price uses the 10-quantity **unit price** as
its basis and rounds to the nearest hundred KRW. Confirmed examples are
625 -> 600 KRW and 650 -> 700 KRW.  
Scope: GLOP-1478 custom sample pricing; AC-02 and AC-03. The unit price is not a
10-item total to divide again. Product/material/size price data and generic
half-hundred tie, decimal precision, and calculation-stage rules remain open
in intake Q-03; do not infer them from these two examples.  
Confidence: confirmed  
Source: SRC-JIRA-01 and SRC-DOC-01, Custom Sample Orders.  
Reviewed: 2026-10-19

ID: KNOW-SAMPLE-002  
Fact: An order containing one or more Custom Samples automatically receives
exactly one complimentary Free Sample Pack regardless of the number of Custom
Samples purchased, in the same shipment.  
Scope: GLOP-1478 custom-containing orders; AC-04. This identifies the bundled
pack quantity only; whether an eligible standalone pack can coexist is not
settled here.  
Confidence: confirmed  
Source: SRC-DOC-01, explicit one-or-more/count wording; SRC-JIRA-01, same-shipment wording.  
Reviewed: 2026-10-19

ID: KNOW-SAMPLE-003  
Fact: The complimentary pack included with a paid Custom Sample order does not
consume the customer's standalone Free Sample Pack eligibility.  
Scope: GLOP-1478 bundle exemption; AC-05. Standalone eligibility is one per
shipping address every six months under KNOW-SAMPLE-005. Address normalization,
exact calendar arithmetic/timezone and consumption event remain unresolved.
This exemption does not establish the policy for a second pack in the same order.  
Confidence: confirmed  
Source: SRC-JIRA-01 and SRC-DOC-01, complimentary bundled pack exemption;
SRC-OWNER-01 for current standalone eligibility policy.  
Reviewed: 2026-10-19

ID: KNOW-SAMPLE-004  
Fact: Shipping is 0 KRW when the applicable subtotal is at least 50,000 KRW,
including exactly 50,000 KRW, and 3,000 KRW when it is below 50,000 KRW.  
Scope: GLOP-1478 plain subtotal threshold; AC-06 and AC-07. Subtotal treatment
relative to discounts, points and tax, and applicable regions/exceptions are
undefined; do not extend the rule to those cases without clarification.  
Confidence: confirmed  
Source: SRC-JIRA-01 and SRC-DOC-01, Shipping Cost.  
Reviewed: 2026-10-19

ID: KNOW-SAMPLE-005  
Fact: Standalone Free Sample Packs are limited to one per shipping address
every six months, plus one per order. A separate order does not bypass address
eligibility.  
Scope: GLOP-1478; AC-01 and AC-08. The QA owner's decision controls this ticket;
no independent lifetime per-customer restriction is confirmed. Exact
calendar-month arithmetic/timezone, consumption event, address normalization
and multi-unit address identity remain unspecified.  
Confidence: confirmed  
Source: SRC-OWNER-01, explicit policy selection, consistent with SRC-FIGMA-01
nodes 603:128, 609:6440 and 624:18119.  
Reviewed: 2026-10-19  
Supersedes: Older SRC-JIRA-01 one-time and SRC-DOC-01 one-time/per-customer
wording for GLOP-1478 eligibility; these were preserved as an unresolved source
conflict rather than previously adopted knowledge entries. The owner decision
resolves that conflict; retain the original sources as history.

Remaining questions are retained in [GLOP-1478 intake Q-01](../../tickets/GLOP-1478/00-intake.md).
Figma 624:18117 and 609:6440 describe bundled-pack exemption from per-order
count and an additional eligible standalone pack. Combined-order coexistence
and exemption from order count still need an owner decision. They are distinct
from the confirmed bundled eligibility exemption and six-month address policy.

## Observed storefront behaviour (not business rules)

The entry below records what a development build displayed. It is evidence of
behaviour, not a requirement, and needs rechecking after app changes.

ID: KNOW-SAMPLE-006  
Fact: With only the standalone free pack in an anonymous cart, the cart preview
lists 샘플팩 Free, 수량: 1개, 0원, shows 합계 0원, and states 배송비 및 할인
내역은 결제 시 적용됩니다 (shipping and discount details are applied at
payment). The preview total therefore excludes shipping and is never evidence
for the shipping rule (KNOW-SAMPLE-004) or any shipping calculation; shipping
needs checkout evidence.  
Scope: Anonymous client-side cart preview on /kr/sample-pack, Chromium,
1440x900. Observed on Nuxt a8322d8d (R5 TC-005/006/008 aria snapshots); the
same note appeared in earlier runs on f9ef1c69 and 363542d7. Authenticated
carts, checkout, and carts with paid items were not observed.  
Confidence: observed  
Source: [R5 execution-inspection.json](../../tickets/GLOP-1478/evidence/2026-10-19T05-42-11-731Z-storefront-b4ef925f/execution-inspection.json),
[R5/R6 results and AC-07 coverage note](../../tickets/GLOP-1478/04-execution.md).  
Reviewed: 2026-10-19
