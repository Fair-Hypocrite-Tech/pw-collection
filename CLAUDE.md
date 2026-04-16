# Claude Notes

Read [AGENTS.md](AGENTS.md) first.

Claude-specific reminders for this repository:

- Prefer minimal diffs over broad cleanup.
- Preserve the current user-facing flow unless the task explicitly changes it.
- Treat gameplay requests as the highest-risk area.
- For UI work, prefer incremental rollout over full rewrites.
- For mock userscript work, keep generated code and config source aligned.
- If a fix can change script timing or page behavior, stop and explain the tradeoff before proceeding.
