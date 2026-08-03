# Maderegger Planer – Meilenstein 1.1

Enthalten:
- Jahreskalender mit Kalenderwochen (KW)
- Heute-Button und Markierung des aktuellen Tages
- Suche mit Trefferliste und direktem Sprung zum Termin
- besonders kurze Termineingabe: Projekt, Terminart, Von, Bis, Priorität
- optionale Angaben eingeklappt unter „Weitere Angaben“
- Supabase-Konfiguration bereits eingetragen

## Installation
1. `supabase.sql` im SQL Editor des Supabase-Projekts ausführen.
2. Benutzer unter Authentication anlegen.
3. In `profiles` die Rolle auf `admin`, `editor` oder `viewer` setzen.
4. Alle Dateien direkt in das GitHub-Repository hochladen.
5. GitHub Pages auf Branch `main` und Ordner `/root` aktivieren.

Wichtig: Niemals einen Secret- oder Service-Role-Key in GitHub speichern. Der eingetragene Publishable Key ist für das Frontend vorgesehen.

## Version 1.2

- Kopfbereich mit Dashboard, Filtern und Legende bleibt am Desktop beim Scrollen sichtbar.
- Linke Navigation bleibt am Desktop fixiert.
- Kalenderwochen werden links in jedem Monat angezeigt.
- Der sichtbare Monat wird in der Navigation automatisch markiert.
- Suchfeld wurde verbreitert.
- Projekteinträge zeigen einen Statuspunkt.
- Termine zeigen beim Darüberfahren eine kompakte Detailvorschau.
- Auf Tablet und Smartphone wird die Fixierung des großen Planungsbereichs deaktiviert, damit ausreichend Kalenderfläche sichtbar bleibt.

Für dieses Update sind keine Änderungen an der Supabase-Datenbank erforderlich.
