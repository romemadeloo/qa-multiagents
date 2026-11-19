# QA prompts

Use these in either Codex or Claude Code from the workspace root. Change the
ticket ID and supply actual source/build details.

## Coordinate the workflow

```text
Coordinate GLOP-1478 as my QA lead. Use the specialist agents for the requested
phases, beginning with the current handoff. Read actual ticket requirements,
Figma, and docs before deriving expected behavior. Continue unblocked work;
record missing inputs. Keep one writer per artifact and summarize next actions.
```

## Plan from supplied sources

```text
For GLOP-1478, delegate intake to qa-intake, then planning to qa-planner after
intake is ready. Use these supplied sources: [ticket content], [Figma frame
links or export], [documentation]. Return test scope, risks, source conflicts,
and questions. Save the outputs and update the handoff in the main session.
```

## Create cases and automation

```text
Use qa-cases for GLOP-1478 based on its confirmed requirements and reviewed
plan. Then use qa-automation for its deterministic automation candidates.
Storefront/admin scope: [actual scope]. Actor and test data: [non-secret
details]. Keep business expectations traceable and execution status honest.
```

## Execute and report

```text
Use qa-execution for GLOP-1478. Target: [storefront/admin]. Build: [actual
identifier]. Execute the selected case IDs: [IDs]. Preserve evidence with
qa:run and record manual outcomes only from actual observations. Then use
qa-defects to draft reports for reproducible product failures.
```

## Retest fixes

```text
Retest GLOP-1478 defects [IDs] on [actual fixed build]. Have qa-execution run
the original failing cases and affected regression, then have qa-defects
update retest history and verified/reopened status from that evidence.
```

## Review release

```text
Use qa-release to assess GLOP-1478 on [candidate build]. Reconcile every
confirmed AC with current-build results and defect retests. Save the evidence
matrix and READY/NOT_READY/INSUFFICIENT_EVIDENCE recommendation. Leave my final
release decision pending.
```

## Review completed-ticket automation for promotion

```text
After I confirm <TICKET> is done and its recorded status matches, use
qa-automation-reviewer to assess its generated Playwright against the main
automation repository at <absolute path>. Give it the generated spec paths,
saved dev servers, verified build and explicit destination write ownership.
Reuse the existing POM, fixtures, data, IDs and tags. Adapt qualified tests and
validate the result; save 08-automation-review.md and a traceable scoped diff
or staged adaptation. Leave promotion and merge decisions pending for me.
```

See [the promotion workflow](automation-promotion.md) for required inputs and
session boundaries.

## Preserve knowledge and resume

```text
Use qa-knowledge to save verified reusable GLOP-1478 findings. Main coordinator:
update ticket.json and 07-handoff.md with current state, blockers, and next
commands. Make the handoff sufficient for a new session in the other tool.
```

```text
Resume GLOP-1478 from its handoff. Read relevant knowledge, identify the next
unblocked phase, and delegate it to its specialist. Preserve previous results.
```

## Review in parallel

```text
For GLOP-1478, use two agents in parallel to review these independent sources:
one reviews requirement coverage and one reviews automation implementation.
Both are read-only for this review. Wait for both, reconcile their findings
in the main conversation, and then assign fixes to one writer per file.
```

## Fallback for a client without subagents

```text
Native subagents are unavailable here. Read AGENTS.md and agents/qa-planner.md,
then perform that role for GLOP-1478 in this conversation. Follow the same file
ownership and handoff rules, and identify this as a single-session review.
```
