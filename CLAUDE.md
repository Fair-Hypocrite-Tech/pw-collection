# Claude Notes

Read [AGENTS.md](AGENTS.md) first.

Claude-specific reminders for this repository:

- Prefer minimal diffs over broad cleanup.
- Keep design proposals compact, implementation-oriented, and aligned with the exact Design Mode format in `AGENTS.md`.
- Preserve the current user-facing flow unless the task explicitly changes it.
- Treat gameplay requests as the highest-risk area.
- For UI work, prefer incremental rollout over full rewrites.
- For mock userscript work, keep generated code and config source aligned.
- For feature work, name the concrete product increment and manual verification path.
- If a fix can change script timing or page behavior, stop and explain the tradeoff before proceeding.
