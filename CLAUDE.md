# Musticker QA workspace

@AGENTS.md

The main Claude Code conversation is the coordinator. Delegate requested QA
phases to the native project agents in `.claude/agents/`. Give each specialist
the full task and input paths; do not depend on conversation history transfer.
Keep coordination in the main conversation rather than asking specialists to
delegate. Shared durable memory lives in `knowledge/` and the ticket folders in
`../tickets/` (outside this repo), so Codex can resume the same work. Follow
`WORKFLOW.md`: create the ticket folder first, then run the stages. Follow the
fallback in AGENTS.md if delegation is unavailable.
