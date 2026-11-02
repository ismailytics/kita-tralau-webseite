// .htaccess je Variante (ADR-0009); astro.config schreibt sie beim Build nach dist/ bzw. dist-vorschau/.
export function htaccess(vorschau) {
	return `# Erzeugt beim Build aus scripts/htaccess.mjs (Variante: ${vorschau ? "Vorschau" : "Prod"}).
<IfModule mod_headers.c>
${
	vorschau
		? `	# Einbetten nur im Visual Editor, nie in Suchmaschinen.
	Header always set Content-Security-Policy "frame-ancestors https://app.storyblok.com"
	Header always set X-Robots-Tag "noindex, nofollow"`
		: `	# Die öffentliche Site darf niemand einbetten.
	Header always set Content-Security-Policy "frame-ancestors 'none'"`
}

	# HTML und ungehashte Dateien bei jedem Aufruf prüfen, damit ein neuer Build sofort ankommt.
	Header set Cache-Control "no-cache"
	# Gehashte Build-Dateien ändern ihren Namen bei jeder Änderung.
	<If "%{REQUEST_URI} =~ m#^/_astro/#">
		Header set Cache-Control "public, max-age=31536000, immutable"
	</If>
</IfModule>
`;
}
