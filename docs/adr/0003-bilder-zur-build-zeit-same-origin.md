# Bilder zur Build-Zeit same-origin statt Storyblok-Image-CDN

Alle Bilder aus Storyblok, auch die im Rich Text, OG-Images und Favicons, werden beim Build über `astro:assets` heruntergeladen und von der eigenen Domain ausgeliefert. Der naheliegende Storyblok Image Service würde zur Laufzeit Requests an Storyblok auslösen und damit ADR-0002 brechen. Bitte nicht „optimieren“, indem Bilder wieder direkt vom CDN kommen.

## Consequences

Der Rich-Text-Renderer braucht eigene Overrides, damit er Storyblok-URLs nie roh ausgibt. Wird ein Bild bei gleicher URL ersetzt, kann der Cache veralten; das muss die Bild-Pipeline berücksichtigen.
