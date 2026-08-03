# Maderegger Planer V2 – Meilenstein 1

## Enthalten
- Jahreskalender mit 12 Monaten
- Heute-Sprung und Monatsnavigation
- getrennte Projektstammdaten und Termine
- Suche nach Projektnummer, Titel, Kunde, Ort und Termintext
- Dashboard für heute, Woche, Montagen und Lieferungen
- Login mit Supabase
- Rollen Admin, Editor, Viewer
- Echtzeitaktualisierung bei Änderungen
- responsive Darstellung

## Einrichtung
1. In Supabase links **SQL Editor** öffnen.
2. **New query** wählen.
3. Inhalt von `supabase.sql` einfügen und **Run** drücken.
4. In Supabase unter **Project Settings / API Keys** den **Publishable key** kopieren.
5. In `config.js` `HIER_DEN_PUBLISHABLE_KEY_EINFUEGEN` ersetzen.
6. Dateien in das GitHub-Repository hochladen.
7. GitHub Pages aktivieren: Settings → Pages → Deploy from branch → main / root.

## Ersten Benutzer anlegen
1. Supabase → Authentication → Users → Add user.
2. Benutzer mit E-Mail und Passwort anlegen.
3. Supabase → Table Editor → profiles.
4. Beim eigenen Benutzer `role` auf `admin` ändern.

## Rollen
- `admin`: Projekte und Termine bearbeiten/löschen, Rollen verwalten
- `editor`: Projekte und Termine anlegen/bearbeiten; Termine löschen
- `viewer`: nur lesen

## Sicherheit
In GitHub darf nur der `sb_publishable_...` Schlüssel stehen. Niemals einen `sb_secret_...` Schlüssel oder den alten `service_role` Schlüssel eintragen.

## Webador
Nach Veröffentlichung über GitHub Pages:
```html
<iframe src="DEINE-GITHUB-PAGES-URL" width="100%" height="1200" style="border:0;border-radius:12px" loading="lazy"></iframe>
```
