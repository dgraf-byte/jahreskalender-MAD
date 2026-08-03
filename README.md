# Montage- & Lieferkalender

Einbettbare Jahreskalender-App für Montagen, Lieferungen, Inbetriebnahmen, Abnahmen und Serviceeinsätze.

## Enthaltene Funktionen

- Jahresansicht mit allen 12 Monaten
- Projektnummer, Projekttitel, Kategorie, Status, Zeitraum, Kunde, Ort, Verantwortlicher, Team und Notizen
- Suche und Filter
- Mehrtägige Termine
- Rollen: Admin, Editor, Viewer
- Anmeldung über Supabase
- Lokaler Demomodus ohne Datenbank
- Responsive Darstellung für PC, Tablet und Smartphone
- Farbgebung in RAL 6018 / RAL 7021 Anlehnung

## Schnelltest

Die Dateien auf einen Webserver oder GitHub Pages hochladen. Solange `config.js` keine Supabase-Zugangsdaten enthält, läuft die App als lokale Demo. Daten werden dabei nur im Browser gespeichert.

## Produktivbetrieb mit Supabase

1. Unter supabase.com ein Projekt anlegen.
2. Im SQL Editor den gesamten Inhalt aus `supabase.sql` ausführen.
3. In Supabase unter **Authentication → Users** die Benutzer anlegen.
4. In der Tabelle `profiles` für jeden Benutzer die Rolle setzen:
   - `admin`: Benutzer und Kalendereinträge verwalten
   - `editor`: Kalendereinträge verwalten
   - `viewer`: nur lesen
5. `config.example.js` kopieren bzw. in `config.js` die Project URL und den anon/public Key eintragen.
6. Alle Dateien auf GitHub Pages, Netlify, Cloudflare Pages oder den eigenen Webspace hochladen.

## Einbindung in Webador

Die App muss auf einer öffentlich erreichbaren HTTPS-Adresse liegen. Danach in Webador ein Einbettungs-/HTML-Element verwenden:

```html
<iframe
  src="https://DEINE-DOMAIN.at/kalender/"
  style="width:100%;height:1200px;border:0;border-radius:12px;"
  loading="lazy"
  allow="clipboard-write">
</iframe>
```

Wichtig: Die Kalenderseite kann technisch öffentlich geladen werden, zeigt im Supabase-Betrieb aber ohne gültige Anmeldung keine geschützten Daten. Die Zugriffsregeln liegen in der Datenbank und nicht nur in der sichtbaren Oberfläche.

## Empfohlene nächste Erweiterungen

- Kalenderwochenansicht
- Export nach Excel/PDF
- Outlook-/iCal-Export
- Benachrichtigung bei neuen oder geänderten Terminen
- Ressourcenplanung für Montageteams und Fahrzeuge
- Datei-Anhänge je Projekt
- Änderungsprotokoll
