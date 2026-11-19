# SAMPLE-101 test plan

Status: APPROVED  
Target and build: https://dev.example.test/ build 2026.11.19-3

## Scope and coverage

In scope: footer newsletter form (desktop and mobile).  
Out of scope: email delivery.

| AC ID | Test objective | Risk and priority | Manual or automated |
| --- | --- | --- | --- |
| SAMPLE-101-AC-01 | Success message on valid email | High / P1 | Automated |
| SAMPLE-101-AC-02 | Validation blocks invalid email | High / P1 | Automated |
| SAMPLE-101-AC-03 | Button disabled when empty | Medium / P2 | Automated |
| SAMPLE-101-AC-04 | Accessible status message | Medium / P2 | Automated |

## Execution matrix

| Surface | Actor | Browser or device | Required checks | Reason |
| --- | --- | --- | --- | --- |
| Footer | Guest | Chromium desktop | All cases | Main traffic |
| Footer | Guest | Mobile 375px | TC-01, TC-03 | Layout of message |

## Entry and exit criteria

Entry: build identified, ACs confirmed.  
Exit: all P1 cases PASS on the candidate build; no open High defects.
