# Daily QA workflow

Use the main conversation as your QA coordinator. Give it a ticket ID and the
phase you want to work on; it delegates that phase to a specialist and saves
the result in the ticket folder. You keep the final QA decision, especially
when requirements are unclear or a release has residual risk.

## First session

Open `C:\Users\Windows\qa-workspace\multi-agents` as the project folder in
Claude Code (or Codex), or start a terminal there and run `claude` or `codex`.
Ticket folders sit beside it in `C:\Users\Windows\qa-workspace\tickets\`. Sign in
to the tool you use. This workspace does not need an OpenAI or Anthropic API
key of its own; authentication belongs to the selected coding tool.

Codex reads AGENTS.md and project agents under .codex/agents. Claude Code reads
CLAUDE.md, which imports the shared rules, and its agents under .claude/agents.
Restart an existing session after this initial setup so newly created agent
directories can be discovered. Models inherit your current session selection.
These paths follow the official [Codex instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[Codex agents](https://learn.chatgpt.com/docs/agent-configuration/subagents),
[Claude Code memory](https://code.claude.com/docs/en/memory), and
[Claude Code agents](https://code.claude.com/docs/en/sub-agents) conventions.

If a client cannot load native custom agents, ask it to read the matching file
in agents/ and perform the role in the main session. The same workflow and
files still work, but this fallback does not provide an independent reviewer.

## Receive a ticket

Say "Start a new ticket." The coordinator asks for the ID, title, description,
Figma links and dev servers, then creates the folder before anything else:

```powershell
npm.cmd run qa:new -- GLOP-1500 'Actual title from Jira' --storefront URL
```

This writes `qa-workspace\tickets\GLOP-1500\`. The coordinator saves what you
pasted under its `sources\` before any specialist starts (see `WORKFLOW.md`). Jira can be read through the Claude browser pane once
you are signed in (see Team rules in `WORKFLOW.md`). Add Figma
frame links, specifications, relevant comments, affected actor roles, and the
build to test. The agent records missing inputs so you can clarify them with
your team. Do not put credentials into these files.

Prompt:

> Use qa-intake for GLOP-1478. Review the supplied ticket sources, extract
> confirmed acceptance criteria with source references, identify the affected
> storefront and admin flows, and record questions in 00-intake.md. Update
> ticket.json and 07-handoff.md in the main conversation.

## Plan and review Figma and documentation

Prompt:

> Use qa-planner for GLOP-1478. Compare the confirmed requirements with the
> available Figma frames and documentation. Write a risk-based test plan,
> browser and actor coverage, test data needs, and entry and exit criteria.
> Clearly identify sources that could not be reviewed.

Review the plan's questions before accepting expected results that depend on
them. A screenshot may establish layout; hidden states and transitions need
their own sources. When a connector is unavailable, provide a relevant export
or text excerpt and keep the review limited to that evidence.

## Create test cases

Prompt:

> Use qa-cases for GLOP-1478. Create 02-cases.csv from the reviewed plan. Map
> every confirmed criterion to cases, include positive, negative, boundary,
> permission, and regression scenarios where relevant, and mark automation
> candidates. Keep all initial execution statuses NOT_RUN.

Open the CSV in your editor or spreadsheet. Check that the steps are practical,
the data exists, and expected results match the requirement sources. Stable
case IDs let you connect manual results, Playwright tests, and Jira defects.

## Write Playwright automation

Prompt:

> Use qa-automation for GLOP-1478. Implement the confirmed automation candidates
> against the actual UI in tests/e2e/. Inspect the page before choosing
> locators. Include case IDs in titles and update 03-automation.md. Run the
> relevant checks and report any flows blocked by missing access or data.

The framework already supports storefront and admin targets. Set the target
in the local .env or for the current PowerShell session:

```powershell
$env:APP_TARGET = 'admin'
npm.cmd test
$env:APP_TARGET = 'storefront'
```

`npm run test:admin` and `npm run test:storefront` choose their configured URL
explicitly. A BASE_URL override applies to normal runs and ticket runs; check
the runner's recorded URL before treating a result as release evidence.

## Execute manual and automated tests

Use the real build identifier supplied by your team in place of BUILD_FROM_TEAM:

```powershell
$env:APP_TARGET = 'storefront'
npm.cmd run qa:run -- GLOP-1478 --build BUILD_FROM_TEAM --project=chromium --grep GLOP-1478
$env:APP_TARGET = 'admin'
npm.cmd run qa:run -- GLOP-1478 --build BUILD_FROM_TEAM --project=chromium --grep GLOP-1478
```

The filter selects titles containing the ticket ID. Before feature tests exist,
this command should fail with no matching tests. That is a useful signal that
the ticket has no automation yet. The initial BASELINE test is separate.

Each run writes run.json, results.json, junit.xml, an HTML report, and any
failure captures into its own ticket evidence directory. The build label is
supplied by you; the runner does not query the application's deployed version.

Prompt:

> Use qa-execution for GLOP-1478 on the identified build. Run the planned
> automation and record case-level evidence in 04-execution.md. Guide me
> through the manual cases and record results only after I provide actual
> observations, or after an available browser tool executes the case.

For manual results, provide case ID, build/target, browser/actor, observed
behavior, and screenshot or other evidence reference. The agent helps organize
your observations. It cannot infer a manual pass from the checklist alone.

## Report defects and verify fixes

Prompt:

> Use qa-defects to triage the observed GLOP-1478 failures. Draft reproducible
> reports under defects/ with evidence, severity rationale, and related cases.
> Update 05-defects.md. Keep Jira publication as a separate explicit request.

When a developer says a defect is fixed, give the coordinator the new build:

> Coordinate GLOP-1478 retesting on BUILD_FROM_TEAM. Have qa-execution rerun
> the original failing cases and impacted regression. Then have qa-defects
> record the evidence-based retest verdict and retain the original failure.

A failed retest reopens the defect. A successful retest must link the fixed
build and relevant case evidence before the defect becomes VERIFIED_FIXED.

## Evaluate release readiness

Prompt:

> Use qa-release to independently assess GLOP-1478 for the candidate build.
> Review all confirmed AC coverage, required manual checks, regression,
> browser/actor coverage, and defect retests. Write READY, NOT_READY, or
> INSUFFICIENT_EVIDENCE with evidence and exact blockers in 06-release.md.
> Keep my release decision pending.

Read the assessment and make the final QA decision. Have the coordinator record
your decision and any named-owner risk acceptance. A green automation run is
only one part of the assessment; required manual and design checks still need
their evidence.

## Save knowledge and stop for the day

Prompt:

> Use qa-knowledge to promote verified reusable findings from GLOP-1478 into
> knowledge/ with source, scope, review date, and confidence. In the main
> conversation, update 07-handoff.md and ticket.json with completed work,
> blockers, current build, and the exact next action.

Knowledge contains reusable facts, standards, and regression lessons. The
ticket folder holds the detailed work and results. This keeps new sessions
focused without losing the reasons behind earlier decisions.

To resume tomorrow, in either tool:

> Resume GLOP-1478. Read AGENTS.md, the knowledge index, and 07-handoff.md.
> Tell me what remains and continue the next unblocked phase using its
> specialist. Preserve earlier evidence and ask only for missing inputs.

Use one active writer per ticket. Finish a handoff before switching between
Claude Code and Codex. Commit sanitized source, knowledge, and ticket summaries
to your own Git repository if desired; raw evidence is local and ignored, so
back it up separately if you need to retain it beyond this machine.
