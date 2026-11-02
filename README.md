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

## Storyblok-Schemas und Beispielinhalte (ADR-0008)

`storyblok/` ist die Quelle für Komponenten, Datasources, Stories, Assets und die daraus erzeugten Typen.

```bash
# STORYBLOK_PERSONAL_ACCESS_TOKEN und STORYBLOK_SPACE_ID setzen (Region EU), dann:
pnpm storyblok:pull
```

Das Skript ersetzt die Space-ID durch `0` und entfernt Autor- und Vorschau-Felder aus den Stories.
Neue Komponenten werden als JSON unter `storyblok/components/` angelegt, mit `pnpm storyblok:push` in den Test-Space geschoben und danach mit `pnpm storyblok:pull` zurückgezogen, damit das Format kanonisch bleibt.

### Push in einen Ziel-Space (Übergabe, Schema-Änderungen)

```bash
# STORYBLOK_PERSONAL_ACCESS_TOKEN und STORYBLOK_SPACE_ID des Ziel-Space setzen (Region EU), dann:
pnpm storyblok:push --dry-run      # zeigt, was passieren würde, schreibt nichts
pnpm storyblok:push                # Datasources → Komponenten (mit Gruppen und Presets) → Assets → Stories (veröffentlicht)
pnpm storyblok:push --nur-schemas  # nur Datasources und Komponenten
```

- Upsert: Komponenten und Stories (gefunden über den Slug) werden angelegt oder aktualisiert. Wiederholtes Ausführen ändert nichts weiter.
- Assets, die es im Ziel-Space schon gibt (gleiche ID, sonst gleicher Dateiname), werden nicht erneut hochgeladen; die Stories verweisen auf sie.
  Grund: CLI 4.26 legt beim Ersetzen eines Assets ein neues an, jeder Lauf gäbe sonst Duplikate.
- Ein voller Push überschreibt die Stories mit den Beispielinhalten. Nach der Übergabe, wenn die Redaktion Inhalte gepflegt hat, Schema-Änderungen nur mit `--nur-schemas` schieben.
- Löschungen werden nicht übertragen: Gelöschte Komponenten, Felder, Stories oder Assets entfernt man im Ziel-Space von Hand.
- Komponenten und Datasources kennen im CLI keinen Dry-Run; `--dry-run` listet sie nur auf.

## Lizenzen

- Theme Elementary von WP Infusion (laut ADR-0007 MIT).
- Beispielbild `spielplatz`: [Wikimedia Commons, CC0](https://commons.wikimedia.org/wiki/File:Spielplatz_D%C3%BCrerweg_in_Metzingen_(Nordostblick_Schaukel).jpg).
- Schriften Nunito und Fredoka: SIL Open Font License, selbst gehostet.
