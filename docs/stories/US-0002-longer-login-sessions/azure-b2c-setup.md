# Azure-B2C-Einstellungen für US-0002 (längere Login-Sessions)

Diese Einstellungen werden **einmalig im Azure-Portal** gemacht (nicht per Code). Sie ergänzen die App-Änderung (Refresh-Token zuerst, `domain_hint` mit gemerktem Anbieter).

**Wo:** Azure-Portal -> Azure AD B2C (Tenant `andreasorganization`) -> *User flows* -> `B2C_1_SignUpSignIn`.

> Die englischen Portal-Bezeichnungen können sich leicht von dieser Anleitung unterscheiden (Bezeichnung kann im Portal leicht abweichen). Per Microsoft Learn bestätigt sind: *User flows -> Properties -> Session behavior*, *Application claims* und "Keep me signed in session" (1-90 Tage). Die übrigen Labels sind sinngemäß angegeben.

## Schritte

1. **Identity-Provider-Claim aktivieren (Pflicht)**
   - *Application claims* öffnen, "Identity Provider" anhaken (nicht zu verwechseln mit "Identity Provider Access Token"), **Save**.
   - Ohne diesen Claim fehlt `idp` im ID-Token. Die App kann sich den Anbieter (z. B. `google.com`) dann nicht merken und verhält sich wie bisher.

2. **Session-Dauer**
   - *Properties -> Session behavior*:
   - "Web app session lifetime (minutes)": **1440** (das Maximum, 24 h).
   - "Web app session timeout": **Rolling**.
   - **Save**.

3. **"Angemeldet bleiben" (nur lokale Konten)**
   - Im selben Abschnitt "Enable keep me signed in session" einschalten, "Keep me signed in session (days)": **90**, **Save**.
   - Wirkt **nur für lokale B2C-Konten**, nicht für Google. Für Google-Logins ist es harmlos, schadet aber nicht.

4. **Prüfen**
   - In der App abmelden und einmal neu anmelden (mit Google).
   - DevTools -> Application -> Local Storage: `andaha.auth.lastIdp` sollte `google.com` sein.
   - Alternativ: User flow im Portal mit "Run user flow" gegen `https://jwt.ms` ausführen und im ID-Token den Claim `idp` prüfen. Dafür muss `https://jwt.ms` als Reply URL in der App-Registrierung eingetragen sein, und die App muss in "Run user flow" ausgewählt werden.

## Erwartetes Verhalten nach Deployment

| Situation | Ergebnis |
|-----------|----------|
| App-Öffnung < 24 h nach letzter Anmeldung | Refresh-Token wird eingelöst, **keine Weiterleitung** |
| App-Öffnung > 24 h (Refresh-Token abgelaufen) | Kurzer Durchlauf B2C -> Google -> App, **ohne B2C-Auswahlseite** (`domain_hint`) |
| Google zeigt ggf. Kontoauswahl | Entscheidet Google (bestehende Google-Session im Browser/PWA), nicht die App |
| Anmeldung bricht ab / B2C meldet Fehler | War ein Anbieter gemerkt: Anbieter wird gelöscht, einmal Neuanmeldung ohne Hint (normale B2C-Seite). Sonst keine automatische Weiterleitung |
| Offline / Netzwerkfehler beim Einlösen des Refresh-Tokens | App bleibt unverändert, **keine Weiterleitung** zur Anmeldung; erneuter Versuch beim Zurückkehren in die App oder sobald das Netz wieder da ist |
| Logout | Gemerkter Anbieter wird gelöscht, wieder die normale B2C-Seite |

Hinweis: Refresh-Tokens für SPAs (Code Flow + PKCE) haben in B2C eine **feste Laufzeit von 24 h**. Die Session-Einstellungen oben sind auf das Maximum gesetzt. Ein aktiver Login ist daher etwa täglich nötig, läuft aber still über Google ab.

## Quellen (Microsoft Learn)

- Token-Laufzeiten: https://learn.microsoft.com/azure/active-directory-b2c/configure-tokens
- Session-Verhalten / KMSI: https://learn.microsoft.com/azure/active-directory-b2c/session-behavior
- Direkte Anmeldung (`domain_hint`): https://learn.microsoft.com/azure/active-directory-b2c/direct-signin
- Hintergrund der Entscheidungen: `design.md` in diesem Ordner
