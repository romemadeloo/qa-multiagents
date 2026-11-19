# {{TICKET_ID}} automation promotion review

Reviewer: qa-automation-reviewer
Reviewed: {{DATE}}
Overall recommendation: PENDING
Human promotion / PR decision: PENDING

## Eligibility and repository context

- QA owner completion decision and evidence:
- Recorded ticket status (done / completed / closed):
- Multi-agent repository, source revision / hashes:
- Main Playwright repository, revision and pre-existing dirty files:
- Assigned source specs and destination write ownership:
- Actual dev servers, served build and browser/project:
- Destination instructions / neighboring specs / fixtures / POM inspected:

## Candidate decisions

| Source spec / case | Confirmed AC / TC | Existing coverage | Destination spec / MS case ID | POM / fixture mapping | Verdict and reason |
| --- | --- | --- | --- | --- | --- |

Use READY_FOR_PROMOTION, NEEDS_CHANGES, NOT_WORTH_PROMOTING, BLOCKED or
NOT_APPLICABLE. Baseline/demo coverage alone never qualifies.

## Adaptation and scoped changes

- Existing POM methods, fixtures and data reused:
- New or extended methods and why reuse was insufficient:
- Import / tag / ID / auth / locale / environment / cleanup adaptations:
- Actual destination files changed:
- Staged files and patches (not yet integrated), if applicable:
- Dependencies and affected POM consumers:
- Complete bundle: promotion/manifest.json and promotion/files/:
- Master promotion:validate command, report and retained artifact paths:
- Destination before/payload SHA-256 values and reviewed source hashes:

## Validation evidence

| Check | Exact command and working directory | Dev server / served build | Counts / exit code / verdict | Evidence path |
| --- | --- | --- | --- | --- |
| Destination typecheck | NOT_RUN | | | |
| Destination lint (if configured) | NOT_RUN | | | |
| Test discovery | NOT_RUN | | | |
| Adapted run 1, retries disabled | NOT_RUN | | | |
| Adapted run 2, retries disabled | NOT_RUN | | | |
| Adapted run 3, retries disabled | NOT_RUN | | | |
| Affected POM / fixture regression | NOT_RUN | | | |

State actual results only. Record unexpected skips, retries, failures and blockers.
Missing necessary validation prevents READY_FOR_PROMOTION.

## Risks, blockers and next actions

- Maintenance owner:
- Open requirements / duplicate coverage / missing execution:
- Next commands and local files for human diff / PR review:
- Proposed coordinator handoff update (ticket status remains unchanged):
