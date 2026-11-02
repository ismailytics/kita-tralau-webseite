<?php
// Vorlage für die SMTP-Konfiguration des Kontaktformulars (ADR-0004).
// Die echte Datei liegt außerhalb von Repo und Webroot; der Pfad kommt aus KONTAKTFORMULAR_KONFIG,
// sonst wird kontaktformular.konfig.php eine Ebene über dem Webroot gelesen.
// Diese Vorlage zeigt auf Mailpit und wird so auch von den Tests genutzt.
return [
	'host' => '127.0.0.1',
	'port' => (int) (getenv('MAILPIT_SMTP_PORT') ?: 1025),
	'benutzer' => '', // leer: ohne SMTP-Anmeldung (Mailpit)
	'passwort' => '',
	'verschluesselung' => '', // '' | 'tls' (STARTTLS, meist Port 587) | 'ssl' (Port 465)
	'absender' => 'formular@kita-tralau.example', // Formular-Postfach
	'empfaenger' => 'kontakt@kita-tralau.example', // Postfach des Vereins
];
