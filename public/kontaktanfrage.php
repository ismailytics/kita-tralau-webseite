<?php
// Kontaktformular → Postfach des Vereins per SMTP (ADR-0004). Antwortet immer mit einer Weiterleitung
// auf eine statische Seite, damit das Formular ohne JS funktioniert.
declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;

function weiter(string $ziel): never
{
	header("Location: /kontakt/$ziel", true, 303);
	exit;
}

// Mindestzeit zwischen Seitenaufruf und Absenden; schnellere Anfragen gelten als Bot.
const MINDESTDAUER_SEKUNDEN = 3;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	header('Location: /kontakt', true, 303);
	exit;
}

$feld = fn (string $name): string => is_string($_POST[$name] ?? null) ? trim($_POST[$name]) : '';
$name = $feld('name');
$email = $feld('email');
$nachricht = $feld('nachricht');

// Honeypot: Bots füllen das versteckte Feld und sollen nicht merken, dass sie erkannt wurden.
if ($feld('webseite') !== '') {
	weiter('danke');
}
// shortcut: Die Dauer misst das Skript der Kontaktseite; ohne JS fehlt sie und die Prüfung entfällt (der Honeypot bleibt).
// Bei Spam ohne JS auf ein serverseitig signiertes Token umstellen.
if ($feld('dauer') !== '' && (int) $feld('dauer') < MINDESTDAUER_SEKUNDEN) {
	weiter('fehler');
}

$gueltig = mb_check_encoding($name . $nachricht, 'UTF-8')
	&& $name !== '' && mb_strlen($name) <= 100 && !preg_match('/[\x00-\x1f]/', $name)
	&& strlen($email) <= 254 && filter_var($email, FILTER_VALIDATE_EMAIL) !== false
	&& $nachricht !== '' && mb_strlen($nachricht) <= 5000;
if (!$gueltig) {
	weiter('ungueltig');
}

// Abhängigkeiten und Zugangsdaten liegen außerhalb des Webroots (eine Ebene darüber).
$autoload = dirname(__DIR__) . '/vendor/autoload.php';
$konfigDatei = getenv('KONTAKTFORMULAR_KONFIG') ?: dirname(__DIR__) . '/kontaktformular.konfig.php';
if (!is_file($autoload) || !is_file($konfigDatei)) {
	error_log('Kontaktformular: vendor/ oder Konfiguration fehlt');
	weiter('fehler');
}
require $autoload;
$konfig = require $konfigDatei;

try {
	$mail = new PHPMailer(true);
	$mail->isSMTP();
	$mail->Host = $konfig['host'];
	$mail->Port = $konfig['port'];
	$mail->SMTPAuth = $konfig['benutzer'] !== '';
	$mail->Username = $konfig['benutzer'];
	$mail->Password = $konfig['passwort'];
	$mail->SMTPSecure = $konfig['verschluesselung'];
	$mail->CharSet = PHPMailer::CHARSET_UTF8;
	$mail->setFrom($konfig['absender'], 'Kontaktformular');
	$mail->addAddress($konfig['empfaenger']);
	$mail->addReplyTo($email, $name);
	$mail->Subject = "Kontaktanfrage von $name";
	$mail->Body = "Name: $name\nMail: $email\n\n$nachricht\n";
	$mail->send();
} catch (Throwable $fehler) {
	error_log('Kontaktformular: ' . $fehler->getMessage());
	weiter('fehler');
}
weiter('danke');
