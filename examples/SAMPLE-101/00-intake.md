# SAMPLE-101 ticket intake

Title: Footer newsletter signup shows a confirmation message  
Created: 2026-11-19  
Intake status: READY_FOR_PLANNING

## Source review

| Source | URL or file | Revision or date | Reviewed | Notes |
| --- | --- | --- | --- | --- |
| Ticket | sources/ticket.md | 2026-11-19 | Yes | Pasted by QA owner |
| Figma | none | - | N/A | Owner confirmed no design |
| Documentation | none | - | N/A | - |

## Scope and context

- Expected behavior: footer form gives visible and screen-reader feedback.
- Surface / actor: storefront footer, guest visitor.
- In scope: footer form only. Out of scope: email delivery and confirmation email content.
- Target: https://dev.example.test/ ; build read from `/build.txt`.

## Acceptance criteria

| AC ID | Criterion | Source | Confirmation |
| --- | --- | --- | --- |
| SAMPLE-101-AC-01 | Valid email shows "Thanks! Check your inbox to confirm." | ticket AC1 | Confirmed |
| SAMPLE-101-AC-02 | Invalid email shows validation message, no request sent | ticket AC2 | Confirmed |
| SAMPLE-101-AC-03 | Empty field disables Subscribe | ticket AC3 | Confirmed |
| SAMPLE-101-AC-04 | Message uses role="status" | ticket AC4 | Confirmed |

## Questions and assumptions

| ID | Question or assumption | Impact | Owner | Status |
| --- | --- | --- | --- | --- |
| Q-01 | Same email subscribed twice: what message? | Expected result for re-submit | PO | Answered: same success message |

## Planning readiness

Ready. All ACs have a source; Q-01 answered.
