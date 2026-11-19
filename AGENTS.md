# QA workspace instructions

This is the Musticker QA workspace. Work from this repository root
(`multi-agents\`). The main conversation coordinates the ticket; specialist
roles focus on one QA phase. `WORKFLOW.md` is the step-by-step flow.

Ticket folders live **outside** this repo, in `qa-workspace/tickets/<ID>/`
(`../tickets/<ID>/` from here; `qa.config.json` `ticketsDir`). In these
instructions and the agent contracts, `tickets/<ID>/` means that folder. Never
create ticket files under `multi-agents/tickets/`.

## Read before working

Read `knowledge/README.md`, `knowledge/product.md`, `knowledge/standards.md`, and
the current ticket's `07-handoff.md`. Read `agents/README.md` to choose a role.
Each ticket's dev servers (storefront, admin, api) live in its `ticket.json`
`environment`, saved when the ticket starts. That is the URL source of truth for
the ticket; `qa.config.json` only supplies registered brands and fallback URLs
for tickets without saved servers. Read only relevant knowledge and ticket
artifacts; do not load all past tickets into every session.

Testing is limited to dev servers. Never open, browse, or test a production host
(for Musticker: www., api., or admin-panel.musticker.com), even read-only. The
scripts refuse any URL that is not a registered brand's dev host. A new brand
(StickerJapan, OzStickerPrinting) must be added to `qa.config.json` `brands`
with its domains, dev host pattern, and production hosts before its first ticket.

## Starting a new ticket (chat intake)

When the user opens a new chat to start a ticket, first ask for: the ticket ID
and title, the ticket description and acceptance criteria, the Figma link(s) if
any, and the dev server(s) unless already saved in the ticket's `ticket.json`.
Ask once, concisely, and do not guess missing values. Then **create the ticket
folder first** (`npm run qa:new`), save the pasted sources in its `sources/`,
and only then orchestrate the specialists as described in `WORKFLOW.md`.
Progress is reported in the chat, recorded in the ticket files and mirrored on
the QA board. Follow the "Team rules" in `WORKFLOW.md` (owner picks the server,
production needs a yes each time, Jira comments are approved before posting).

## Coordination

For ticket workflow requests, delegate each requested phase to its matching
specialist when native subagents are available. The main session owns
`ticket.json` and `07-handoff.md`; specialists return proposed status updates.
The main session creates new ticket folders with
`npm run qa:new -- ID "Title" --storefront URL --admin URL --api URL`, giving the
servers the user supplied. Change them with `npm run qa:env -- ID --storefront URL ...`
(the full new set; the old set moves to `environmentHistory`). Never guess a server.
Give specialists the brief format in `WORKFLOW.md`: ticket ID, absolute ticket
folder, absolute repo root, input artifact paths, environment/build, a bounded
task, and their exclusive output paths.
Wait for prerequisite outputs before starting a dependent phase. Allow up to
three specialists at once only when inputs are stable and output files differ.
Never run two agents against shared mutable accounts/data simultaneously.
After the QA owner confirms a ticket is done/completed/closed, delegate its
generated automation to qa-automation-reviewer before recommending promotion
to the main Playwright repository. Give it both absolute repository paths,
source specs, saved dev servers/build and exclusive destination write paths.
A READY release assessment is not ticket completion. Keep
08-automation-review.md and the promotion recommendation separate from the
ticket's completed QA status; only the human owner approves promotion/merge.
When subagents are unavailable, read `agents/<role>.md` and perform that role in
the main session; identify this fallback honestly. Do not claim independent review.

## Evidence and boundaries

Separate confirmed requirements, observed behavior, assumptions, and open
questions. A link alone does not mean its contents were reviewed. Jira is read
through the Claude browser pane once the owner has signed in (see `WORKFLOW.md`
Team rules); otherwise the owner pastes the ticket text. If
Figma or documentation cannot be accessed, record the missing source and ask
for its content or an authorized connector. Continue independent work.
Never invent acceptance criteria, test results, bug reproduction, or manual
execution. Manual tests stay NOT_RUN until a named human or an actual browser
session supplies observations. Test automation code is not execution evidence.
The local demo and BASELINE tests never satisfy a ticket's feature coverage.

Local artifacts are authorized. Draft defects and Jira comments locally; post a
comment only after the owner approves its text, and never change Jira status. Recommend release readiness from evidence;
the QA owner makes the release decision. Do not deploy or change ticket status
as a side effect of writing a release assessment.
Use test environments and synthetic data. Keep secrets and authentication state
in ignored local files. Sanitize evidence before committing or sharing it.

## Files and quality

Use stable IDs: `<ticket>-AC-01`, `<ticket>-TC-001`, `<ticket>-BUG-001`.
Keep traceability from acceptance criterion to case, automated test, run, and
defect. Preserve previous run evidence and defect retest history.
Specialists follow their contracts in `agents/`. Never silently broaden write
ownership. Only the knowledge curator edits shared product knowledge during
ticket work; other agents propose entries in the ticket handoff.

Use TypeScript Playwright tests, semantic locators, isolated test data,
web-first assertions, and no fixed sleeps. Run `npm run check` after framework
or agent changes, and the relevant Playwright suite after automation changes.
`npm run test:demo` validates the local harness. `npm test` runs the real
storefront baseline by default; `npm run test:admin` selects admin.
Use `npm run qa:run -- ID --build BUILD --project=chromium` to preserve ticket
run evidence; it uses the ticket's saved servers and refuses a conflicting
BASE_URL. Record the exact target, server, and build; results from an older build
or another server do not establish a fix. Specs import `test` and `expect` from
`tests/e2e/fixtures.ts`, which blocks production requests and provides `apps`,
`adminPage`, and `api` for the ticket's servers.

## Token budget

Each specialist runs on the model set for its role in `agents/registry.json`
and only has the tools its role needs. Keep context small:

- Delegate with paths, IDs, and the bounded task; never paste file contents or
  earlier specialist reports into a prompt.
- Read the current-state ticket files only. Read `tickets/<ID>/history/` only
  when the task needs a specific earlier run, retest, or session. Use Grep or a
  line range for large files and read only the knowledge files the task needs.
- Keep `04-execution.md` and `05-defects.md` under about 8 KB, and
  `07-handoff.md` under about 3 KB. Before an edit would exceed that, move the
  superseded runs, retests, or sessions verbatim to
  `tickets/<ID>/history/<file stem>-YYYY-MM-DD.md` and leave a one-line pointer.
  The owner of a file owns its history files. History is append-only: never
  delete or rewrite it, and keep every ID traceable.
- End every specialist result with a report of at most 300 words: files changed,
  verdicts or counts, blockers and open questions, proposed ticket.json or
  handoff updates, and the suggested next phase. Details belong in the owned files.

## Knowledge and handoff

At the end of a phase, return files changed, source/evidence references, findings,
unresolved questions, and the suggested next phase. The coordinator updates
the ticket handoff with completed work, remaining work, and exact next commands.
Promote reusable facts through `qa-knowledge`, with source, date, scope, and
confidence. Never promote guesses or temporary UI behavior to business rules.

Canonical roles live in `agents/*.md` and `agents/registry.json`. After changing
them, run `npm run agents:sync`; commit both generated adapters. Do not hand-edit
`.claude/agents/*.md` or `.codex/agents/*.toml`.
