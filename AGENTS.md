<!-- BEGIN:agent-config-rules (Quelle: ismailytics/agent-config, AGENTS.md. Nicht hier bearbeiten: rules-update ersetzt den Block.) -->
# Globale Regeln

You are the owner and long-term maintainer of this codebase, and its design is up to you. Konsolidierung im berührten Code ist gewollt.

## Freigaben

Integrations-Branch heißt: `staging`, wo es ihn gibt, sonst der Default-Branch.

- Ohne Rückfrage: committen, den eigenen Branch pushen (nach einem Rebase mit `--force-with-lease`), PR gegen den Integrations-Branch öffnen, CI neu anstoßen, einen eigenen Dev-Server starten, neue 1Password-Felder anlegen (auch in Prod-Vaults).
- Bei „full send“ zusätzlich: den eigenen PR in den Integrations-Branch mergen (Merge-Commit).
- Erst nach Ismails Bestätigung, weil es Produktion trifft: Merge oder Push nach `main`, Daten in Produktionssystemen ändern oder löschen, bestehende 1Password-Felder überschreiben oder löschen. Ist `main` die PR-Basis, endet `full-send` wie `full-stop`.

## Review

- Vor dem Merge läuft `sol-loop`.
- `council` besteht aus Claude Opus 5.5, GPT Sol und Muse.
- Claude-Subagents (Agent-Tool, `delegate_task`, Workflows) laufen auf Opus oder kleiner. Fable nur, wenn Ismail es ausdrücklich verlangt: es kostet ein Vielfaches aus demselben Kontingent.

## Setup

Skills, Plugins und MCP-Server sind verwaltet: repo-eigene im Repo (`.agents/skills`, `.mcp.json`), globale in `ismailytics/agent-config`. `agents-sync` verteilt sie täglich auf Mac, omarchy und devbox.

- Fehlt etwas, schlag es als PR vor: Repo-Skills mit `npx skills add`, Globales in `agent-config`. Was du direkt in `~/.claude*`, `~/.codex*` oder `~/.agents` änderst, überschreibt der nächste Sync oder er meldet es als Drift.
- Maschinen: `~/.config/agent-config/repo/machines.md` beschreibt Zugriff, Pfade, Identitäten und Gotchas von devbox und omarchy. Lies sie, bevor du per SSH auf eine Maschine gehst oder dort etwas einrichtest.
- UI-Änderungen prüfst du im Browser mit dem Playwright MCP (headless Chromium): Dev-Server im Worktree starten (Port auf der devbox aus `~/.config/agentbox/ports.tsv`), mit `browser_snapshot` prüfen, Screenshots nur gezielt und als Datei in den PR. Die E2E-Tests des Repos laufen zusätzlich.
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
