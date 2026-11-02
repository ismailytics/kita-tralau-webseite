# Storyblok Free mit einem geteilten Redaktionszugang

Die Redaktion soll die Site nach dem Bau ohne Entwickler pflegen. Nur deshalb ist ein Headless-Stack (CMS + Build) für eine kleine Kita-Site gerechtfertigt. Wir nehmen Storyblok wegen des visuellen Editors (niedrigste Lernkurve) im Free-Plan und teilen einen einzigen `redaktion@`-Login: zwei vertraute Personen, etwa monatliche Pflege, ein zweiter Seat (~180 €/Jahr) und ein Audit-Trail bringen hier nichts.

## Consequences

Free erlaubt 1 Space. Entwicklung läuft deshalb in einem eigenen Test-Space des Entwicklers, Produktion in einem eigenen Space des Vereins (siehe ADR-0008).
