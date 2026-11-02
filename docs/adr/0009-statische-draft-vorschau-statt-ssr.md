# Statische Draft-Vorschau statt SSR-Vorschau

Die Live-Vorschau von `@storyblok/astro` braucht eine Server-Laufzeit, und keiner der Hoster-Kandidaten (ADR-0005) bietet Node. Für die Vorschau der Redaktion bauen wir deshalb eine zweite, statische Version der Site mit Entwürfen statt veröffentlichter Inhalte. Sie liegt unter einer nicht verlinkten `noindex`-URL beim selben Hoster und wird bei jedem Speichern neu gebaut. Nur dort ist die Storyblok-Bridge eingebunden. Der Preis: Änderungen sind erst nach dem Neubau sichtbar, nicht live.

## Consequences

Ein Prototyp (Branch `prototype/static-draft-preview`, 2026-11-02) hat bestätigt:

- Klick-zum-Bearbeiten im Visual Editor funktioniert auch auf der statischen Vorschau.
- Lokal dauert es vom Speichern bis zur sichtbaren Änderung 3–4 s.
- Der Prod-Build mit `bridge: false` macht keine Requests an Storyblok und enthält weder Storyblok-Code noch `data-blok`-Attribute.

Nicht gemessen ist die Wartezeit beim echten Hoster mit Webhook → CI-Build → Deploy, erwartet werden etwa 1–2 Minuten. Beim Speichern lädt die Bridge die Vorschau sofort neu, zeigt dabei aber noch den alten Stand. Die Vorschau braucht deshalb einen sichtbaren Hinweis „wird aktualisiert“, bis der neue Build ausgeliefert ist.

## Considered Options

- SSR-Vorschau bei einem zusätzlichen EU-Node-Hoster: echte Live-Vorschau, aber ein weiterer Account samt Kosten und Wartung. Rückfallebene, falls die Wartezeit beim Hoster für die Redaktion nicht tragbar ist.
- Keine Vorschau: Damit fiele der Hauptgrund für Storyblok weg (ADR-0001).
- Passwortschutz der Vorschau: verworfen, weil der Login-Dialog im Editor-Iframe stört und die Entwürfe nicht heikel sind.
