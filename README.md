# QA Multi-Agents

A QA team of **9 AI specialist agents** that work inside **Claude Code** (or Codex).
You give it a ticket; the agents take it from **intake → test plan → test cases →
Playwright automation → execution → defects → release decision**, and save every
step as plain files in a ticket folder.

> Want to see the result first? Open the finished example ticket:
> **[examples/SAMPLE-101](examples/SAMPLE-101/)** (fictional, end to end).

---

## How this helps

| Without it | With it |
| --- | --- |
| Test plans and cases written by hand for every ticket | Agents draft intake, plan and cases from the ticket text in minutes; you review |
| Acceptance criteria get missed | Every AC gets an ID (`SAMPLE-101-AC-01`) and every case links back to it, so gaps are visible |
| Results live in chat or someone's head | Every stage writes a file (`00-intake.md` … `07-handoff.md`), so anyone can pick up the ticket |
| "Passed" with no proof | Runs are tied to a named build with saved evidence (screenshots, traces) |
| Bugs reported without steps | `qa-defects` writes reproducible reports and tracks retest until VERIFIED_FIXED |
| Release call is a gut feeling | `qa-release` (never the tester) checks coverage, results and defects and recommends READY / NOT_READY / INSUFFICIENT_EVIDENCE |
| Knowledge lost between tickets | `qa-knowledge` saves verified, reusable facts in `knowledge/` |

The human QA owner stays in control: you pick the test server, approve the cases,
and make the final release decision. Agents never test production.

---

## The agents

| Stage | Agent | What it does | Writes |
| --- | --- | --- | --- |
| 1a | `qa-intake` | Reads the ticket, extracts acceptance criteria, lists missing info | `00-intake.md` |
| 1b | `qa-planner` | Risk, scope, browsers/devices, entry/exit criteria | `01-plan.md` |
| 2 | `qa-cases` | Traceable manual + automation test cases | `02-cases.csv` |
| 2 | `qa-automation` | TypeScript Playwright tests for the cases | `03-automation.md`, `tests/e2e/…` |
| 3 | `qa-execution` | Runs tests, records actual results and evidence | `04-execution.md`, `evidence/` |
| 4 | `qa-defects` | Bug reports, retest tracking | `05-defects.md`, `defects/` |
| 5 | `qa-release` | Independent release readiness check | `06-release.md` |
| after | `qa-automation-reviewer` | Promotes good tests into the main suite | `08-automation-review.md` |
| any | `qa-knowledge` | Saves reusable verified knowledge | `knowledge/` |

The main Claude chat is the **coordinator**: it briefs each agent and keeps
`ticket.json` and `07-handoff.md` up to date. Agents talk only through files.
Full rules: [WORKFLOW.md](WORKFLOW.md).

---

## Setup (first time)

Needs: [Git](https://git-scm.com/download/win), [Node.js 22+](https://nodejs.org),
and [Claude Code](https://claude.com/claude-code).

```powershell
New-Item -ItemType Directory -Force "$HOME\qa-workspace\tickets" | Out-Null
Set-Location "$HOME\qa-workspace"
git clone https://github.com/romemadeloo/qa-multiagents.git multi-agents
Set-Location multi-agents
npm ci
npm run browsers:install
Copy-Item .env.example .env
npm run check
npm run test:demo
```

- `npm run check` verifies agents, TypeScript and scripts.
- `npm run test:demo` runs a local demo to prove Playwright works.
- Edit `qa.config.json` to point at **your** dev servers and Jira URL.
- Never put passwords in tracked files; use `.env` (ignored by git).

Ticket folders are created **outside** the repo in `../tickets/`. Let Claude
access them by adding this to `.claude/settings.local.json`:

```json
{ "permissions": { "additionalDirectories": ["C:/Users/<you>/qa-workspace/tickets"] } }
```

---

## How to use it (one ticket)

**1. Create the ticket folder**

```powershell
npm run qa:new -- SAMPLE-101 "Footer newsletter signup shows a confirmation message" --storefront https://dev.example.test/
```

This creates `../tickets/SAMPLE-101/` with all template files and `ticket.json`.

**2. Open Claude Code in this folder and paste the ticket**

> Start SAMPLE-101. Here is the description and acceptance criteria: … Figma: none.
> Test server: https://dev.example.test/. Coordinate it using the QA specialists.

**3. Review at each gate** — the coordinator stops and asks you when it needs a decision:

| After | You check |
| --- | --- |
| Intake / plan | Are the ACs right? Answer open questions |
| Cases | Does every AC have a case? Approve |
| Execution | Was it run on the right build? |
| Release | Make the final release decision |

**4. Run the automated tests for the ticket (keeps evidence)**

```powershell
npm run qa:run -- SAMPLE-101 --build 2026.11.19-3 --project=chromium
```

**5. Continue later** — say *"Continue SAMPLE-101"*. The coordinator reads
`07-handoff.md` and picks up where it stopped. More prompts: [docs/prompts.md](docs/prompts.md).

---

## Sample ticket walkthrough

[examples/SAMPLE-101](examples/SAMPLE-101/) shows a full run on a fictional
"newsletter signup" ticket:

| File | What you'll see |
| --- | --- |
| [sources/ticket.md](examples/SAMPLE-101/sources/ticket.md) | The original ticket text |
| [00-intake.md](examples/SAMPLE-101/00-intake.md) | 4 ACs with IDs, 1 question answered |
| [01-plan.md](examples/SAMPLE-101/01-plan.md) | Risk, priority, browser matrix |
| [02-cases.csv](examples/SAMPLE-101/02-cases.csv) | 5 cases, each linked to an AC |
| [03-automation.md](examples/SAMPLE-101/03-automation.md) | Which cases are automated and where |
| [04-execution.md](examples/SAMPLE-101/04-execution.md) | Run R1 finds a bug, run R2 passes on the fixed build |
| [05-defects.md](examples/SAMPLE-101/05-defects.md) + [defects/](examples/SAMPLE-101/defects/) | Bug report, then VERIFIED_FIXED |
| [06-release.md](examples/SAMPLE-101/06-release.md) | qa-release recommends READY |
| [07-handoff.md](examples/SAMPLE-101/07-handoff.md) | Where the ticket stands for the next session |

---

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run qa:new -- ID "Title" --storefront URL` | Create a ticket folder |
| `npm run qa:env -- ID --storefront URL` | Change a ticket's test server |
| `npm run qa:run -- ID --build BUILD --project=chromium` | Run ticket tests and keep evidence |
| `npm run check` | Agents + TypeScript + script tests |
| `npm run test:demo` | Local demo harness |
| `npm test` / `npm run test:admin` | Run the storefront / admin suite |
| `npm run test:ui` | Playwright UI for debugging |
| `npm run agents:sync` | Regenerate `.claude/` and `.codex/` agents after editing `agents/` |

## Repository layout

```text
agents/            agent role definitions (source of truth) + registry.json
.claude/agents/    generated Claude Code agents
.codex/agents/     generated Codex agents
WORKFLOW.md        ticket flow and hand-off rules
knowledge/         shared product knowledge, standards, decisions
templates/         ticket and defect templates
tests/e2e/         Playwright tests
demo/              local demo app + test
scripts/           qa:new, qa:run, qa:env, agent sync
docs/              daily guide, prompts, troubleshooting
examples/          SAMPLE-101 finished example ticket
qa.config.json     dev servers, production hosts (blocked), Jira URL
```
