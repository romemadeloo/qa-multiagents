# Ticket workflow: create folder > plan > write tests > testing > evaluate > release

Everything runs from one Claude Code chat whose folder is `multi-agents\`. Progress
is reported in the chat and saved in the ticket files; the QA board mirrors it
(see Team rules). There are no hooks or office view.

## Where things live

```text
qa-workspace\
  START-HERE.md            how to use the workspace day to day
  tickets\                 one folder per ticket (outside the repo, easy to browse)
    <ID>\                  00-intake.md ... 07-handoff.md, ticket.json, evidence\, defects\
  multi-agents\            this repo: agents, rules, scripts, templates, Playwright tests
  musticker-playwright\    main Playwright suite (promotion target)
```

- The tickets folder is `qa.config.json` `ticketsDir` (`../tickets`), resolved from
  `multi-agents\`. `QA_TICKETS_DIR` overrides it. Scripts (`qa:new`, `qa:env`,
  `qa:run`) all use this location.
- In every brief and contract, `<tickets>` means that folder. Always give
  specialists the **absolute** ticket path, for example
  `C:\Users\Windows\qa-workspace\tickets\GLOP-1500\`. Never create ticket files
  under `multi-agents\tickets\`.
- Automation code stays in the repo: `multi-agents\tests\e2e\`.

## Step 0: create the ticket folder first

No specialist starts until the ticket folder exists. When the owner starts a new
ticket, the coordinator (main chat):

1. **Asks once** for: ticket ID and title; the description and acceptance
   criteria (pasted, or read from Jira in the browser pane, see Team rules); Figma link(s)
   or "none"; the dev server(s) to test (storefront, admin, api). It does not
   guess missing values and waits until it has at least the ID and description.
2. **Creates the folder:**
   `npm run qa:new -- ID "Title" --storefront URL --admin URL --api URL`.
   If `<tickets>\<ID>\` already exists, it reuses it and reads `07-handoff.md`
   instead (qa:new never overwrites).
3. **Saves the sources** the owner pasted under `<tickets>\<ID>\sources\`
   (ticket text, Figma links, notes) so specialists read files, not chat.
4. **Confirms** in one line: the folder path, saved servers, and that stage 1
   starts now. Then runs the stages below.

## Stages

| Stage | Specialist | Reads | Writes (in `<tickets>\<ID>\`) | Gate before the next stage |
| --- | --- | --- | --- | --- |
| 1a. Intake | qa-intake | `sources\`, `ticket.json` | `00-intake.md` | ACs extracted with sources; gaps recorded |
| 1b. Plan | qa-planner | `00-intake.md`, Figma, docs | `01-plan.md` | Owner answers open questions |
| 2. Write tests | qa-cases, then qa-automation if requested | `00`, `01` | `02-cases.csv`; `03-automation.md` + `multi-agents\tests\e2e\...` | Owner reviews cases; every AC has a case |
| 3. Testing | qa-execution (main chat does browser steps) | `02`, `03`, `ticket.json` | `04-execution.md`, `evidence\` | Runs are on a named build from `<host>/build.txt` |
| 4. Evaluate | qa-defects | `04`, `evidence\` | `05-defects.md`, `defects\` | Every defect VERIFIED_FIXED, closed or DEFERRED |
| 5. Release | qa-release (never the tester) | `00`–`05` | `06-release.md` | Owner makes the release decision |
| After any stage | qa-knowledge | verified findings | `multi-agents\knowledge\` | — |
| After owner confirms done | qa-automation-reviewer | specs, evidence | `08-automation-review.md`, `promotion\` | Owner approves promotion |
| Always | coordinator | specialist reports | `ticket.json`, `07-handoff.md` | — |

## How the coordinator and specialists talk

Specialists cannot see the chat; files are the only channel.

**Coordinator → specialist (brief).** Every delegation contains, and nothing more:

```text
Ticket: <ID>
Ticket folder: <absolute path to tickets\<ID>\>
Repo: <absolute path to multi-agents\>
Servers / build: <from ticket.json environment> / <build or "unconfirmed">
Read: <exact input files>
Task: <one bounded task for this stage>
You own (write only these): <exact output files>
```

Never paste file contents or earlier reports into a brief.

**Specialist → coordinator (report, ≤ 300 words).** Files changed; verdicts or
counts; blockers and open questions; proposed `ticket.json` updates (`phase`,
`status`, `phases.<stage>`); suggested next stage.

**Coordinator after each report:**

1. Updates `ticket.json` (`phase`, `phases.<stage>`, `updatedAt`, `build`) and
   `07-handoff.md` (done, remaining, blockers, exact next action).
2. Checks the gate. If it fails, it asks the owner or sends the stage back.
3. Stops with a short summary and waits for "go", unless the owner asked for a
   fully automatic run.
4. Starts the next stage. Independent work may run in parallel (at most three
   specialists, distinct output files, no shared accounts or test data).

## Rules

1. Create the ticket folder before any other work (step 0).
2. Write test cases before executing. Map every run to a case ID as it happens.
3. A scope or design change returns to stage 1; qa-cases re-scopes before more testing.
4. Release review is never written by the agent that tested. If a specialist is unavailable, say so in the file (fallback, not independent).
5. Browser steps the embedded browser cannot do (Turnstile, popups such as Npay, downloads, Figma login) go to the QA owner, recorded in the handoff.
6. Dev servers only. Credentials stay in `multi-agents\.env`, never in ticket files.
7. Keep `04-execution.md` and `05-defects.md` under about 8 KB and `07-handoff.md` under about 3 KB; move older material to `history\`.
8. Record the exact build for every run. A result from an older build or another server does not establish a fix.
9. Daily reports and chat summaries are written from the ticket files, not from memory.

## Team rules (how the QA owner and Claude work together)

The QA owner (Senior QA) leads; Claude is the tester who runs each case. Report
after every stage and wait for the owner's "go" before the next one.

**Servers**
- The owner picks the test server for every run. Never pick one yourself, even
  the default (`E2E_ENVIRONMENT=qa` = dev-1, falling back to dev-2).
- Reading and writing on dev servers is allowed. Keep test data self-cleaning
  (`QA-E2E` prefix) and empty the shared test member's cart after a test.
- Production: before every write or checkout on production, name the exact
  action and get the owner's yes, each time.

**Jira** (glophics-team-tejd16ze.atlassian.net)
- Reading: the owner signs in to Atlassian in the Claude browser pane. Read a
  ticket from that page with `/rest/api/3/issue/<KEY>?expand=renderedFields`.
  Read `fields.description` (ADF) too; the rendered HTML can come back empty.
  Save what you read under `<tickets>\<ID>\sources\`.
- Commenting: allowed on the tickets the owner assigns. Show the full comment
  text first and post only after the owner approves it. Never change a ticket's
  status unless told.
- Format: emoji status line, `Updated by: [QA]_<name>`, Environment, Summary
  bullets. Write the signature as plain text in ADF (no backslashes before the
  brackets).
- Answering a Dev handoff or fix comment: post as a threaded reply.
  `POST /rest/api/3/issue/<KEY>/comment` with `parentId` = the thread's ROOT
  comment id (a reply to a reply still uses the root), and start the ADF body
  with a `mention` node for the comment's author (`author.accountId`).
- Save each draft, and note when and where it was posted (comment id), in
  `<tickets>\<ID>\jira\` (for a subtask: `<parent>\subtasks\<ID>\jira\`),
  never loose in `tickets\`.

**QA board**
- The owner's QA board (a claude.ai artifact) shows ticket and defect status.
  Update it after each stage, together with `ticket.json` and `07-handoff.md`.

**Per stage:** confirm server → test → update the ticket folder → update the
board → draft the Jira comment → owner approves → post.

## Resuming a ticket

The coordinator reads `AGENTS.md`, `knowledge\README.md` and
`<tickets>\<ID>\07-handoff.md`, says what remains, and continues the next
unblocked stage with its specialist.
