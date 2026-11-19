# QA workspace decisions

| ID | Date | Decision | Reason and source |
| --- | --- | --- | --- |
| DEC-001 | 2026-10-19 | Start a fresh TypeScript Playwright project | QA owner requested a fresh start independent of existing automation |
| DEC-002 | 2026-10-19 | Store shared memory in repository files | Allows Claude Code and Codex to resume the same ticket |
| DEC-003 | 2026-10-19 | Keep demo and real test configurations separate | Makes harness verification distinguishable from product evidence |
| DEC-004 | 2026-10-19 | Use the supplied storefront and admin development URLs | QA owner provided both targets |
| DEC-005 | 2026-10-19 | Start with default QA standards in standards.md | Workspace starter policy; QA owner may revise per team conventions |
| DEC-006 | 2026-10-20 | Each ticket saves its own storefront, admin and api servers in ticket.json; runs use them | QA owner: each ticket targets its own server, supplied at ticket start |
| DEC-007 | 2026-10-20 | Test dev servers only; scripts refuse production and unregistered hosts | QA owner: focus testing on dev servers, not production, across Musticker, StickerJapan and OzStickerPrinting |
