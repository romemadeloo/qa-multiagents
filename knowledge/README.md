# Shared QA knowledge

Both tools read these files as durable memory. Start here, then read only the
topics relevant to the ticket. Chat history and a tool's private memory are
not the source of truth for this workspace.

| File | Contents |
| --- | --- |
| product.md | Confirmed product context, actor roles, and business rules |
| sample-packs.md | Source-backed sample pricing, bundled packs, shipping, standalone eligibility, remaining questions, and observed cart-preview behaviour |
| environments.md | Targets, access/setup procedures, storefront build identification, development-only UI |
| standards.md | QA evidence, automation conventions, release criteria |
| decisions.md | Dated choices and their rationale |
| regression.md | Reusable risks and regression lessons, including automation readiness and visibility pitfalls |

During ticket work, qa-knowledge owns shared entries; other specialists propose
updates in their phase results. Each promoted entry includes:

```text
ID: KNOW-...
Fact or lesson:
Scope:
Confidence: confirmed | observed | unconfirmed
Source: URL, ticket artifact, or explicit QA owner decision
Reviewed: YYYY-MM-DD
Supersedes: entry ID, if applicable
```

Confirmed means supported by an authoritative requirement or owner decision.
Observed means seen in a specific build/environment. Unconfirmed remains a
question and should normally stay with its ticket. Recheck observed details
before relying on them after an app change. Preserve replaced rules as
superseded rather than silently rewriting history. Sanitize raw evidence and
keep credentials out of knowledge.
