# QA agent roles

The main chat coordinates the workflow. Nine specialists have separate file
ownership. A role can be used alone or as one step in the whole ticket workflow.

| Phase | Specialist | Required inputs | Owned outputs |
| --- | --- | --- | --- |
| Receive ticket | qa-intake | Ticket content, source links | 00-intake.md |
| Plan and review | qa-planner | Intake, accessible Figma and docs | 01-plan.md |
| Design cases | qa-cases | Reviewed plan, requirements | 02-cases.csv |
| Automate | qa-automation | Cases, actual UI, target details | 03-automation.md, assigned test files |
| Execute | qa-execution | Cases, test code, environment/build | 04-execution.md, new evidence run directories |
| Report and retest defects | qa-defects | Observed failures, evidence | 05-defects.md, individual defect reports, developer handoff packets in defects/<BUG-ID>/ |
| Evaluate release | qa-release | Current build execution and retests | 06-release.md |
| Review completed-ticket automation | qa-automation-reviewer | Owner-confirmed completion, generated specs, main Playwright suite / POM, dev build evidence | 08-automation-review.md, promotion/ staging, explicitly assigned destination specs / POM / helpers |
| Save knowledge | qa-knowledge | Verified findings and source references | knowledge/ |

All numbered files live under `tickets/<ID>/`, which is `qa-workspace/tickets/<ID>/`
outside this repo; the coordinator gives each specialist its absolute path.
Automation code goes in this repo's `tests/e2e/`. The main conversation alone edits
`ticket.json` and `07-handoff.md`. Give every delegated task explicit paths and
write ownership. Other files require a new assignment from the coordinator.
Read-only source material may be shared; output files and mutable test data
must have one writer at a time.

The default sequence is intake, planning, cases, automation, execution, defects,
retest, and release review. Manual execution can start once its cases and
environment are ready; it need not wait for all automation. The knowledge
curator can run after any completed phase. Reopen earlier phases when the
requirements or design change.

After the QA owner confirms completion, qa-automation-reviewer assesses whether
the generated automation belongs in the main suite, reuses its POM and fixtures,
adapts assigned code, and validates the adapted result. It records per-candidate
promotion recommendations; the human still owns the PR/merge decision. This is
a post-completion phase, not an extra release prerequisite or an automatic
background watcher. See [promotion workflow](../docs/automation-promotion.md).

For execution and defect retests, the execution agent owns run artifacts; the
defects agent reads those artifacts and records the retest verdict. A developer
saying "fixed" is a trigger to retest, rather than a passing result.

Role contracts here are portable plain Markdown. `npm run agents:sync` embeds
them into Claude Code Markdown definitions and Codex TOML definitions. Commit
both adapters with the source contracts. Each role's Claude Code model and
tools are set in `registry.json`; the coordinator runs on the parent session's
model, and Codex roles inherit the Codex session model. The two products run separately and share files; they do not share a
live agent scheduler. Use only one tool as the active writer for a ticket.
