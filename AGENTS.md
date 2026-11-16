<!-- BEGIN:agent-config-rules (source: ismailytics/agent-config, AGENTS.md. Do not edit here: rules-update replaces this block.) -->
# Global rules

You are the owner and long-term maintainer of this codebase, and its design is up to you. Consolidating the code you touch is wanted.

## Permissions

The integration branch is `staging` where it exists, otherwise the default branch.

- Without asking: commit, push your own branch (after a rebase with `--force-with-lease`), open a PR against the integration branch, re-run CI, start your own dev server, create new 1Password fields (also in prod vaults).
- On "full send", additionally: merge your own PR into the integration branch (merge commit).
- Only after Ismail confirms, because it affects production: merging or pushing to `main`, changing or deleting data in production systems, overwriting or deleting existing 1Password fields. When `main` is the PR base, `full-send` ends like `full-stop`.

## Review

- `sol-loop` runs before the merge.
- `council` consists of Claude Opus 5.5, GPT Sol and Muse.
- Claude subagents (Agent tool, `delegate_task`, workflows) run on Opus or smaller. Use Fable only when Ismail explicitly asks for it: it costs several times as much from the same quota.

## Setup

Skills, plugins and MCP servers are managed: repo-specific ones in the repo (`.agents/skills`, `.mcp.json`), global ones in `ismailytics/agent-config`. `agents-sync` distributes them daily to the Mac, omarchy and devbox.

- If something is missing, propose it as a PR: repo skills with `npx skills add`, global things in `agent-config`. Whatever you change directly in `~/.claude*`, `~/.codex*` or `~/.agents` is overwritten by the next sync or reported as drift.
- Machines: `~/.config/agent-config/repo/machines.md` describes access, paths, identities and gotchas of devbox and omarchy. Read it before you SSH into a machine or set something up there.
- Check UI changes in the browser with the Playwright MCP (headless Chromium): start the dev server in the worktree (on the devbox, take the port from `~/.config/agentbox/ports.tsv`), check with `browser_snapshot`, and take screenshots only where needed, attached to the PR as files. The repo's E2E tests run in addition.

## Language

Write instructions for agents (`AGENTS.md`, `docs/agents`, skills) in English.
<!-- END:agent-config-rules -->

# kita-tralau-webseite

Website der Kindergruppe Travenbrück e.V. (Kita Tralau).

## Agent skills

### Issue tracker

Issues und Specs liegen in den GitHub Issues dieses Repos (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Die fünf Standardrollen, Labelname = Rollenname (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` und `docs/adr/` im Repo-Root. See `docs/agents/domain.md`.
