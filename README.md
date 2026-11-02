# Website der Kindergruppe Travenbrück e.V.

Statische Astro-Site (Theme [Elementary](https://github.com/wpinfusion/elementary), entkernt), Inhalte aus Storyblok.
Fachbegriffe: `GLOSSARY.md`. Entscheidungen: `docs/adr/`.

## Start

```bash
nvm use            # Node 24 aus .nvmrc
corepack enable    # pnpm in der Version aus package.json
pnpm install
pnpm build         # Build mit den Beispielinhalten aus storyblok/ + Check auf Storyblok-Reste in dist/
pnpm test          # Unit-Test des Checks + Playwright gegen dist/
pnpm dev           # Entwicklungsserver
```

Playwright nutzt lokal das installierte Chrome (`channel: "chrome"`), in CI das Chromium von Playwright.

## Inhaltsquelle

Seiten holen Inhalte nur über `src/inhaltsquelle/`. Die Umgebungsvariable `INHALTSQUELLE` wählt die Implementierung:

| Wert | Quelle | Braucht |
| --- | --- | --- |
| `beispiel` (Standard) | Stories und Assets in `storyblok/` | nichts |
| `storyblok` | veröffentlichte Inhalte aus dem Space | `STORYBLOK_TOKEN` (Preview- oder Public-Token) |

Bilder laufen in beiden Fällen über `astro:assets` und landen same-origin in `dist/` (ADR-0003).
Verlinkte Dateien (z. B. PDFs im Rich Text) lädt der Build ebenfalls herunter und legt sie unter `/dateien/` ab.

## Storyblok-Schemas und Beispielinhalte (ADR-0008)

`storyblok/` ist die Quelle für Komponenten, Datasources, Stories, Assets und die daraus erzeugten Typen.

```bash
# STORYBLOK_PERSONAL_ACCESS_TOKEN und STORYBLOK_SPACE_ID setzen (Region EU), dann:
pnpm storyblok:pull
```

Das Skript ersetzt die Space-ID durch `0` und entfernt Autor- und Vorschau-Felder aus den Stories.
Neue Komponenten werden als JSON unter `storyblok/components/` angelegt, mit dem Storyblok-CLI in den Space geschoben und danach zurückgezogen.
Das CLI überträgt keine Löschungen; die macht man im Ziel-Space von Hand.

## Lizenzen

- Theme Elementary von WP Infusion (laut ADR-0007 MIT).
- Beispielbild `spielplatz`: [Wikimedia Commons, CC0](https://commons.wikimedia.org/wiki/File:Spielplatz_D%C3%BCrerweg_in_Metzingen_(Nordostblick_Schaukel).jpg).
- Schriften Nunito und Fredoka: SIL Open Font License, selbst gehostet.
