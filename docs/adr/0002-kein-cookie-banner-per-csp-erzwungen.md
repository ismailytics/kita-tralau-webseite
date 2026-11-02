# Kein Cookie-Banner, per CSP erzwungen

Die Site kommt ohne Cookie-Banner aus, weil sie keine Dritt-Requests macht. Das ist ein Merkmal der Site, keine Nebenwirkung. Damit es nicht auf Vertrauen beruht, setzt eine strikte CSP (`connect-src 'self'; img-src 'self'` usw.) es im Browser durch: Ein versehentlicher Dritt-Request bricht sichtbar, statt still durchzurutschen. Die Headline ist „kein Tracking“, nicht „null JS“: Selbst gehostete First-Party-Islands sind erlaubt. Schriften werden selbst gehostet, die Kontaktseite bekommt ein statisches Kartenbild oder einen OSM-Link statt einer Google-Maps-Einbettung, und das Storyblok-Bridge-Script landet nie im Production-Build.

## Consequences

Die CSP kommt in zwei Schichten: Astro schreibt sie als Meta-Tag mit Hashes in jede Seite (hosterunabhängig, lokal per E2E prüfbar), und ein `.htaccess` im Repo setzt, was nur als Header wirkt (z. B. `frame-ancestors`). Beide Hoster-Kandidaten sind Apache. Das `.htaccess` wird erst nach dem ersten Deploy beim Hoster geprüft.
