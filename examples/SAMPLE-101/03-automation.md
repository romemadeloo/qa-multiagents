# SAMPLE-101 automation mapping

Status: DONE

## Case implementation

| Case ID | Test file and test title | Target | Status | Notes |
| --- | --- | --- | --- | --- |
| SAMPLE-101-TC-01 | tests/e2e/footer/sample-101-newsletter.spec.ts › valid email shows success | storefront | Implemented | |
| SAMPLE-101-TC-02 | same file › invalid email is blocked | storefront | Implemented | Asserts no POST to /api/newsletter |
| SAMPLE-101-TC-03 | same file › empty field disables button | storefront | Implemented | |
| SAMPLE-101-TC-04 | same file › status role | storefront | Implemented | |
| SAMPLE-101-TC-05 | - | - | Manual | Low value to automate |

## Setup and execution

No login needed. Run:
`npm run qa:run -- SAMPLE-101 --build 2026.11.19-3 --project=chromium`

## Verification

Typecheck passed. See 04-execution.md runs R1 and R2.
