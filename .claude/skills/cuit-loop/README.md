# cuit-loop — Claude Code / Codex skill

This directory is a Claude Code skill that turns a captured cuit session
into a permanent CI regression gate. Same shape works for Codex and any
agent that reads structured skill definitions.

## Files

| File | Purpose |
|---|---|
| `SKILL.md` | The skill specification — the agent reads this. |
| `example-session.json` | A canonical 14-event session capturing the segment-collision bug. Use this to validate the skill end-to-end before pointing it at real data. |
| `README.md` | This file. |

## How an agent uses this

1. The agent's host (Claude Code, Codex, Cursor) loads `SKILL.md` and
   sees it described under `/cuit-loop` (or the equivalent slash command
   the host exposes).
2. The user attaches a session JSON file — either by drag-and-drop, by
   pasting the JSON inline, or by referencing a path.
3. The agent triggers the skill. The skill walks the agent through the
   `Steps` section of `SKILL.md`: read session, generate spec, run, RED,
   diagnose, fix, GREEN, PR.
4. The agent reports back using the structured `Output format`.

## How a human uses this

```bash
# Try it against the bundled example without invoking an agent at all:
cd proof-of-concept
pnpm proof:agent-loop   # uses an in-process recorder, then runs the skill steps
```

For a real session captured from the Chrome extension:

```bash
# 1. Capture in the extension. Click "Download" — gets cuit-session-XXXX.json
# 2. Drop the JSON into your repo, e.g. ./session.json
# 3. In Claude Code: "/cuit-loop ./session.json"
# 4. Watch the loop close: spec generated, RED, fix, GREEN, PR.
```

## Codex / Cursor / Aider equivalents

The skill is plain Markdown — paste `SKILL.md` content into a system
prompt or `.cursorrules` / `.codexrules` equivalent. The behavior is
the same.

## Testing the skill

Run `pnpm proof:agent-loop` from the PoC root. The agent-loop CLI is the
machine-executable reference implementation of every step in `SKILL.md`.
If it succeeds, the skill is wired correctly.
