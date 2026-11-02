# Website der Kindergruppe Travenbrück e.V.

Statische Astro-Site (Theme [Elementary](https://github.com/wpinfusion/elementary), entkernt), Inhalte aus Storyblok.
Fachbegriffe: `GLOSSARY.md`. Entscheidungen: `docs/adr/`.

## Start

```bash
nvm use            # Node 24 aus .nvmrc
corepack enable    # pnpm in der Version aus package.json
pnpm install
pnpm build         # Prod nach dist/ (+ Check auf Storyblok-Reste) und Vorschau nach dist-vorschau/, mit den Beispielinhalten
pnpm test          # Unit-Tests der Skripte + Playwright gegen dist/ und dist-vorschau/
pnpm dev           # Entwicklungsserver
```

Playwright nutzt lokal das installierte Chrome (`channel: "chrome"`), in CI das Chromium von Playwright.
`pnpm test` braucht außerdem `php` (ab 8.1), `mailpit` im `PATH` und einmal `composer install` (siehe Kontaktformular).

## Kontaktformular (ADR-0004)

Das Formular auf `/kontakt` postet an `public/kontaktanfrage.php`. Das Skript prüft die Eingaben, verschickt per SMTP mit PHPMailer
(Absender: Formular-Postfach, `Reply-To`: Besucher) und leitet auf `/kontakt/danke`, `/kontakt/ungueltig` oder `/kontakt/fehler` weiter.
Spam-Schutz: Honeypot-Feld `webseite` und mindestens 3 Sekunden zwischen Seitenaufruf und Absenden (gemessen per JS; ohne JS greift nur der Honeypot).

Lokal mit PHP-Built-in-Server und Mailpit, ohne echte Mails:

```bash
brew install php composer mailpit   # oder statische Binaries, Hauptsache im PATH
composer install                    # PHPMailer nach vendor/
pnpm build
mailpit                             # SMTP auf :1025, Postfach unter http://localhost:8025
KONTAKTFORMULAR_KONFIG=$PWD/kontaktformular.konfig.example.php php -S localhost:8000 -t dist
# http://localhost:8000/kontakt öffnen, absenden, Mail in Mailpit ansehen
```

Die Tests starten PHP-Server und Mailpit selbst (Ports aus `TEST_PORT` abgeleitet, siehe `playwright.config.ts`); in CI läuft Mailpit als Service-Container.

Beim Hoster:

- `vendor/` (per `composer install --no-dev`) liegt eine Ebene über dem Webroot, also neben dem Inhalt von `dist/`.
- Die SMTP-Zugangsdaten stehen in `kontaktformular.konfig.php` eine Ebene über dem Webroot, nie im Repo. Vorlage: `kontaktformular.konfig.example.php`.
  Liegt die Datei woanders, zeigt `KONTAKTFORMULAR_KONFIG` (z. B. per `SetEnv` in der `.htaccess`) auf sie.

## Inhaltsquelle

Seiten holen Inhalte nur über `src/inhaltsquelle/`. Die Umgebungsvariable `INHALTSQUELLE` wählt die Implementierung:

| Wert | Quelle | Braucht |
| --- | --- | --- |
| `beispiel` (Standard) | Stories und Assets in `storyblok/` | nichts |
| `storyblok` | veröffentlichte Inhalte aus dem Space | `STORYBLOK_TOKEN` (Preview- oder Public-Token) |

Bilder laufen in beiden Fällen über `astro:assets` und landen same-origin in `dist/` (ADR-0003).
Storyblok-Bilder bekommen beim Build einen Hash ihres Inhalts an die URL (`?v=…`). Ersetzt die Redaktion ein Bild bei gleicher URL,
ändert sich so der Dateiname unter `/_astro/` und der Cache (`immutable`) liefert nicht die alte Version.
Teilen-Bild (OG/Twitter) und Favicon kommen ebenfalls aus `astro:assets`: Favicon aus dem Logo der Globalen Angaben,
das Bild aus dem Teaserbild eines Beitrags bzw. dem ersten Foto eines Albums, sonst aus dem Hero-Bild der Startseite. Die absoluten URLs setzt `SITE_URL`
(z. B. `SITE_URL=https://www.example.org pnpm build`); ohne Angabe der Platzhalter `https://kita-tralau.example`.
Verlinkte Dateien (z. B. PDFs im Rich Text) lädt der Build ebenfalls herunter und legt sie unter `/dateien/` ab.

## Vorschau (ADR-0009)

`VARIANTE=vorschau` baut die Vorschau für die Redaktion nach `dist-vorschau/`: Entwürfe statt veröffentlichter Inhalte, Storyblok-Bridge,
`data-blok`-Attribute für Klick-zum-Bearbeiten, `noindex` und keine Hash-CSP (die Bridge fügt Stylesheets ein).
Jeder Vorschau-Build legt `build-id.txt` ab. Die Seite fragt sie alle 2 s ab und lädt bei neuer ID neu. Nach dem Speichern im Editor
zeigt sie bis dahin den Hinweis „wird aktualisiert“. Beide Varianten bekommen beim Build eine `.htaccess` aus `scripts/htaccess.mjs`
(`frame-ancestors`, `X-Robots-Tag` für die Vorschau, Cache-Header).

Lokal mit dem Visual Editor des Test-Space (Location `https://localhost:4443/`):

```bash
pnpm vorschau:zertifikat   # einmalig: selbstsigniertes Zertifikat nach .vorschau/
# STORYBLOK_TOKEN (Preview-Token) setzen, dann:
pnpm vorschau              # baut aus den Entwürfen, HTTPS auf https://localhost:4443/, baut bei jeder Draft-Änderung neu
```

**Wichtig:** `https://localhost:4443/` einmal direkt im Browser öffnen und das Zertifikat akzeptieren. Sonst bleibt das Editor-Iframe leer.

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
- Asset-URLs in Stories zeigen danach auf die Assets im Ziel-Space, auch Bilder und Datei-Links im Rich Text.
- Löschungen werden nicht übertragen: Gelöschte Komponenten, Stories oder Assets entfernt man im Ziel-Space von Hand. Gelöschte Felder verschwinden mit dem Komponenten-Push aus dem Schema.
- Komponenten und Datasources kennen im CLI keinen Dry-Run; `--dry-run` listet sie nur auf.

## Lizenzen

- Theme Elementary von WP Infusion (laut ADR-0007 MIT).
- Beispielbild `spielplatz`: [Wikimedia Commons, CC0](https://commons.wikimedia.org/wiki/File:Spielplatz_D%C3%BCrerweg_in_Metzingen_(Nordostblick_Schaukel).jpg).
- Schriften Nunito und Fredoka: SIL Open Font License, selbst gehostet.
