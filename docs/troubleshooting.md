# QA workspace troubleshooting

## PowerShell blocks npm.ps1

Use npm.cmd and npx.cmd, as in the guide. No machine-wide execution-policy
change is required.

## The coding tool cannot find a role

Start the tool from the workspace root, restart after initial setup, and run
`npm.cmd run agents:check`. Custom roles need a client version that supports
the native file format. The installed Codex configuration uses the current
standalone TOML agent format; older releases may require an update.
If native delegation is unavailable, use the explicit role-file fallback.

## Claude Code is not installed

The workspace includes Claude Code definitions, but installing this project
does not install or authenticate the Claude Code CLI. Follow its official
[setup instructions](https://code.claude.com/docs/en/setup), sign in, then open
this folder. Continue using Codex while that setup is pending.

## Browser executable is missing

Run `npm.cmd run browsers:install`. Playwright browser binaries are tied to
the installed package version; reinstall after a Playwright upgrade. See the
official [browser documentation](https://playwright.dev/docs/browsers).

## Jira or Figma needs login

For Jira, sign in to Atlassian in the Claude browser pane and ask again.
For Figma, add the Figma connector. Otherwise provide the relevant ticket
text/design export. Keep passwords and tokens out of tracked files.
Record inaccessible sources in intake rather than claiming they were reviewed.

## No tests match a ticket

The baseline has no ticket ID. Add tests for reviewed cases with the ticket ID
in each title, then rerun with `--grep GLOP-1478`. A no-tests failure should not
be turned into a passing run by suppressing the error.

## Open the right report

`npm.cmd run report` opens artifacts/latest/html for an ordinary real run.
For the demo use `npx.cmd playwright show-report artifacts/demo/html`. For a
ticket run, use `npx.cmd playwright show-report ../tickets/GLOP-1478/evidence/RUN_ID/html`,
replacing RUN_ID with the actual saved folder name. These report commands open
an interactive server; close it with Ctrl+C.

## A target points to the wrong environment

Inspect qa.config.json and local APP_TARGET/BASE_URL values. Normal runs allow
BASE_URL overrides. Explicit target commands use their configured URL. A
ticket run records the actual URL in run.json. Record the actual build too;
the runner does not discover the deployed version automatically.

## The demo port is occupied

The fixture uses 127.0.0.1:4179 and refuses to reuse an existing server. Close
your own process using that port or choose another port consistently in
demo/server.mjs and playwright.demo.config.ts. Do not stop an unknown process.

## The role contracts changed

Edit agents/*.md or agents/registry.json, run `npm.cmd run agents:sync`, and
then `npm.cmd run check`. The generated adapters carry the same contracts.
Do not change only one tool's adapter.
