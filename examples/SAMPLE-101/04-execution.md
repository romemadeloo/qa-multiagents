# SAMPLE-101 execution results

Overall status: PASS (after retest)

## Run register

| Run ID | Date and executor | Target and build | Browser or device | Selection | Evidence path |
| --- | --- | --- | --- | --- | --- |
| R1 | 2026-11-19 qa-execution | dev.example.test 2026.11.19-2 | Chromium | TC-01..04 | evidence/R1/ |
| R2 | 2026-11-19 qa-execution | dev.example.test 2026.11.19-3 | Chromium + 375px | TC-01..05 | evidence/R2/ |

## Case results

| Case ID | AC IDs | Run ID | Mode | Status | Expected and actual result | Evidence | Defect ID |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SAMPLE-101-TC-01 | AC-01 | R1 | auto | PASS | Message shown | R1/tc01.png | |
| SAMPLE-101-TC-02 | AC-02 | R1 | auto | FAIL | Message shown, but POST /api/newsletter was still sent | R1/trace.zip | SAMPLE-101-D1 |
| SAMPLE-101-TC-03 | AC-03 | R1 | auto | PASS | Button disabled | R1/tc03.png | |
| SAMPLE-101-TC-04 | AC-04 | R1 | auto | PASS | role="status" present | R1/report | |
| SAMPLE-101-TC-02 | AC-02 | R2 | auto | PASS | No request sent | R2/trace.zip | SAMPLE-101-D1 |
| SAMPLE-101-TC-05 | AC-01 | R2 | manual | PASS | Same success message | R2/tc05.png | |

## Retest history

| Defect ID | Original run | Fixed build | Retest run and cases | Result | Regression impact |
| --- | --- | --- | --- | --- | --- |
| SAMPLE-101-D1 | R1 | 2026.11.19-3 | R2 / TC-01..05 | VERIFIED_FIXED | None found |
