# Maderegger Firmenkalender 2.0.0

Schlanker Firmenkalender ohne Projektverwaltung und ohne zusätzliches Login.

## GitHub
Diese Dateien ersetzen:
- index.html
- styles.css
- app.js
- config.js

## Supabase
Einmalig `supabase_update_001_company_calendar.sql` im SQL Editor ausführen.

## Bedienung
- Doppelklick auf Tag: Termin anlegen
- Klick auf Termin: bearbeiten/löschen
- Pflichtfelder: Terminart, Termin, Von, Bis
- optional: Projektnummer, Info

## Sicherheit
Die GitHub-Pages-Adresse ist technisch öffentlich erreichbar. Das SQL erlaubt deshalb mit dem Publishable Key anonymes Lesen und Bearbeiten. Der Passwortschutz der eingebetteten Webador-Seite schützt nicht die direkte GitHub-Pages-URL.
