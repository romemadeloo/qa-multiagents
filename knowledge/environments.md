# Musticker environments

Each ticket is tested on its own dev servers. The storefront, admin and api URLs
the QA owner supplies at ticket start are saved in `tickets/<ID>/ticket.json`
under `environment` (brand, server, URLs, source, recordedAt). `npm run qa:env`
replaces them and keeps the previous set in `environmentHistory`. `qa:run` and
Playwright read them; a BASE_URL that differs from the saved server stops the run.

Testing is dev-only (DEC-007). A URL is accepted only when its host matches a
brand's `devHostPattern` in `qa.config.json` `brands` and is not one of its
`productionHosts`. Unregistered domains are refused, so StickerJapan and
OzStickerPrinting need their brand entries before their first ticket. During runs
the shared fixture aborts requests to production hosts and fails the test on
navigations, API calls and writes there.

`qa.config.json` `targets` still holds the fallback storefront and admin URLs for
tickets without saved servers and for ad-hoc runs. The default APP_TARGET is
storefront; APP_TARGET=admin or api selects another app. The explicit test:admin
and test:storefront commands use the configured fallback URLs and ignore BASE_URL.

| Detail | Current value |
| --- | --- |
| Timezone for human reports | Asia/Manila |
| Artifact timestamps | UTC ISO timestamps; convert when reporting local time |
| Ticket system | Jira, glophics-team-tejd16ze.atlassian.net |
| Authentication | Not configured; document account roles without passwords |
| Build identification | Storefront: owner label plus the served Nuxt build id, verified before and after each run (KNOW-ENV-002). Admin: no method established |
| Figma and documentation links | To be added per ticket |
| Test data and cleanup | To be established from confirmed workflows |

Authentication files belong under ignored `playwright/.auth/`. Use `.env` for
local secrets if needed. Never paste cookies, tokens, or real customer records
into ticket reports. A browser login or authenticated connector must be
configured in the tool where the agent runs; a URL in a prompt does not grant
access to a private Jira issue or Figma file.

## Initial access observations

ID: KNOW-ENV-001  
Fact: The public admin URL rendered a login screen, and its document title was
empty during the initial Chromium baseline run.  
Scope: Supplied development admin target; deployed build unidentified.  
Confidence: observed  
Source: initial setup baseline run, 2026-10-19 (raw report since removed).  
Reviewed: 2026-10-19

ID: KNOW-ACCESS-001  
Fact: Opening GLOP-1478 in an unauthenticated browser redirected to Atlassian
login; the issue contents were not available in that session.  
Scope: Initial Jira access only; authenticated access has not been tested.  
Confidence: observed  
Source: browser access check during initial setup, 2026-10-19.  
Reviewed: 2026-10-19

## Storefront build identification and deployment drift

ID: KNOW-ENV-002  
Fact: On the dev-static-9 storefront, the served deployment is identified by
the `id` in `/_nuxt/builds/latest.json` (no-cache GET), corroborated by the
buildId embedded in the page HTML and by `/_nuxt/builds/meta/<id>.json`
returning 200 for the served id and 404 for a replaced one. The owner build
label does not uniquely identify a deployment: on 2026-10-19 the QA owner
mapped two different Nuxt ids, 363542d7 (built 02:26:16Z) and then a8322d8d
(manifest timestamp 05:17:30Z), to the same label Ms-static-9 / 0baee185 /
1026-20261016. Three distinct Nuxt ids were served that day: f9ef1c69 (R1/R2;
its mapping to the label was owner-supplied but never verified, and its meta
file later returned 404), 363542d7 (R3/R4) and a8322d8d (R5/R6). The manifest
timestamp is not the public cutover time: 363542d7 was still served at
05:23:21Z although the a8322d8d manifest is stamped 05:17:30Z. Practice: record
the owner label and the Nuxt id, and re-verify the Nuxt id before and after
every evidence run; a different id means stop and obtain owner confirmation
before recording verdicts. Results on one Nuxt id do not carry over to another.  
Scope: Storefront https://dev-static-9.musticker.com/ (qa.config.json) only.
Admin build identification is not established. The commit and build label are
owner-confirmed and cannot be read from the served application. run.json
metadata stores the owner label, so the Nuxt id is bound to a run only through
its build-verification.json.  
Confidence: observed (deployment behaviour); the two Nuxt-to-label mappings are
owner-confirmed.  
Source: [owner build confirmations](../../tickets/GLOP-1478/sources/jira/qa-owner-clarifications-2026-10-19.md),
[R5/R6 build checks](../../tickets/GLOP-1478/04-execution.md),
[R5 build-verification.json](../../tickets/GLOP-1478/evidence/2026-10-19T05-42-11-731Z-storefront-b4ef925f/build-verification.json),
[defect register build table and ENV-01](../../tickets/GLOP-1478/05-defects.md),
[release build verification](../../tickets/GLOP-1478/06-release.md),
[inspection notes](../../tickets/GLOP-1478/sources/automation/tc004-tc008-inspection-notes.md).  
Reviewed: 2026-10-19

## Development-only UI

ID: KNOW-ENV-003  
Fact: A DEV toolbar with a `Close dev options until refresh` button was present
on the storefront deployment served at about 01:40Z on 2026-10-19 (Nuxt
f9ef1c69; R1/R2 cart helpers had to close it because it overlapped the cart
preview at 1440x900). It was absent at 390, 767, 768, 1024 and 1440 px on Nuxt
363542d7. No explicit toolbar check is recorded for a8322d8d; R5/R6 passed with
a conditional handler, which does not show whether the toolbar appeared.
Treat the toolbar as optional development-environment UI: never assert it as
a required step; if tests must cope with it, register `page.addLocatorHandler`
for its real close button.  
Scope: Development storefront environment behaviour only. Not a product
requirement and not a defect. Behaviour outside this development target was
not observed. Its presence may change with any redeploy.  
Confidence: observed  
Source: [03-automation.md readiness notes and HARN-02](../../tickets/GLOP-1478/03-automation.md),
[HARN-02](../../tickets/GLOP-1478/05-defects.md),
[inspection notes](../../tickets/GLOP-1478/sources/automation/tc004-tc008-inspection-notes.md)
and tc004-devtoolbar-probe.json beside them.  
Reviewed: 2026-10-19
