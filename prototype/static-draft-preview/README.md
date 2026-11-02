# PROTOTYP – wegwerfen

Klärt ADR-0009: Funktioniert eine **statische Draft-Vorschau** im Storyblok Visual Editor, und macht der Prod-Build **null** Storyblok-Requests?
Gegen das Default-Schema eines Storyblok-Test-Spaces (Story `home`, Bloks `page`/`teaser`/`grid`/`feature`). Kein Produktionscode.

```bash
pnpm install
pnpm cert           # einmalig: selbstsigniertes Zertifikat
pnpm preview        # Draft-Build + HTTPS-Server auf https://localhost:4443 + Watcher (Rebuild bei Änderung)
pnpm check:prod     # Prod-Build, lädt die Seite headless, listet alle Requests an fremde Domains
```

Visual Editor: Space → Settings → Visual Editor → Location `https://localhost:4443/`. Vorher `https://localhost:4443/` einmal direkt öffnen und das Zertifikat akzeptieren.

## Ergebnis (2026-11-02)

1. Klick-zum-Bearbeiten im Visual Editor auf der statischen Draft-Vorschau: **funktioniert**.
2. Speichern → sichtbare Änderung lokal: **3–4 s** (Poll ≤ 2 s, Build 1,5 s, Reload ≤ 1,5 s). Nicht gemessen: Webhook → CI → Deploy beim Hoster.
3. Prod-Build mit `bridge: false`: **keine** fremden Requests, kein Storyblok-Code, keine `data-blok`-Attribute.

Entscheidung: ADR-0009 auf `main`. Hinweise: Astro 7 braucht Node ≥ 22.23.4 (`.nvmrc` = 24). Das Visual-Editor-Iframe lädt erst, nachdem das Zertifikat einmal direkt akzeptiert wurde.
