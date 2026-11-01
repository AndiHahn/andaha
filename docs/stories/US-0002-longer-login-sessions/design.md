# Design: Längere Login-Sessions im MiniClient (US-0002)

## Intent

Der Nutzer verwendet den MiniClient fast nur als PWA am Handy und meldet sich meist über **Google** (Social-IdP in Azure AD B2C) an. Heute erscheint jeden Morgen die B2C-Login-Seite. Ziel: die App öffnen und direkt weiterarbeiten; aktive Eingaben nur noch etwa monatlich oder seltener.

**Erfolg:** Morgens öffnet sich die App ohne B2C-Auswahlseite – entweder ganz ohne Weiterleitung (Refresh-Token noch gültig) oder mit kurzem Aufblitzen (stiller Durchlauf über B2C → Google → App).

**Anti-Goal:** Eine Weiterleitungsschleife oder ein Zustand, in dem man nicht mehr zur normalen Login-Seite kommt (z. B. weil man ein anderes Konto/einen anderen Anbieter nutzen will).

## Warum es heute täglich passiert (recherchiert, Context7 / Microsoft Learn)

| Fakt | Quelle |
|------|--------|
| Refresh-Tokens für SPAs (Code Flow + PKCE) haben in B2C eine **fixe Laufzeit von 24 h** | learn.microsoft.com/azure/active-directory-b2c/configure-tokens, tokens-overview |
| B2C-Web-App-Session max. 24 h; KMSI („Angemeldet bleiben“, 1–90 Tage) **nur für lokale Konten** | …/session-behavior |
| `domain_hint=<idp-domain>` überspringt die B2C-Auswahlseite und leitet direkt zum Social-IdP | …/direct-signin, …/enable-authentication-angular-spa-app-options |
| Der Claim `idp` (z. B. `google.com`) kann im User Flow unter *Application claims → Identity Provider* aktiviert werden | …/custom-policies-series-sign-up-or-sign-in-federation, User-Flow-Portal |

Dazu im Code (`auth.service.ts`): Nach `tryLogin()` wird bei abgelaufenem Access-Token (1 h) sofort `initLoginFlow()` aufgerufen – der vorhandene Refresh-Token wird nie probiert.

Die App läuft (Prod) auf einer Azure Static Web App, der Login auf `andreasorganization.b2clogin.com` – unterschiedliche Sites, B2C-Cookies wären im iframe Third-Party-Cookies. Silent-Refresh per iframe scheidet daher (v. a. auf iOS) aus.

## Entscheidungen (mit dem Nutzer vereinbart)

1. **Refresh-Token zuerst.** Beim Start: gültiger Access-Token → angemeldet. Sonst, wenn ein Refresh-Token im Storage liegt → `oauthService.refreshToken()`. Erfolg → angemeldet, keine Weiterleitung. Fehler → Neuanmeldung (Punkt 3).
2. **Zuletzt verwendeten Anbieter merken.** Nach jedem Token-Empfang (Login und Refresh) wird der `idp`-Claim aus den Identity-Claims gelesen und in `localStorage` gespeichert. Kein `idp`-Claim (lokales Konto) → gemerkten Wert entfernen.
3. **Neuanmeldung mit `domain_hint`.** `initLoginFlow('', { domain_hint: <idp> })`, wenn ein Anbieter gemerkt ist; sonst `initLoginFlow()` wie bisher.
4. **Refresh-Fehler zur Laufzeit / PWA kommt zurück in den Vordergrund.** `setupAutomaticSilentRefresh()` bleibt. Auf das Event `token_refresh_error` hin wird – falls kein gültiger Access-Token mehr vorhanden ist – die Neuanmeldung nach Punkt 3 gestartet. *(Eigene Entscheidung:)* Zusätzlich prüft die App bei `visibilitychange` → `visible` die Session (gleiche Logik wie beim Start: gültig → nichts; sonst Refresh, sonst Neuanmeldung). Grund: Eine iOS-PWA wird beim Öffnen oft nur aus dem Hintergrund fortgesetzt statt neu geladen, d. h. `init()` läuft nicht erneut und Timer sind unzuverlässig.
5. **Fehler-Antwort von B2C → kein Hint, keine Schleife.** `tryLogin()` lehnt mit einem `code_error` ab, wenn die Authorize-Antwort einen `error`-Parameter enthält (z. B. Abbruch bei Google; heute bleibt die App dann hängen). *(Eigene Entscheidung:)* War ein Anbieter gemerkt, wird er gelöscht und einmal ohne Hint neu angemeldet → normale B2C-Auswahlseite. War keiner gemerkt, wird **nicht** automatisch weitergeleitet (Verhalten wie heute) – so kann ein wiederholt sofort fehlschlagender B2C-Aufruf keine Endlosschleife erzeugen.
6. **Logout** löscht den gemerkten Anbieter vor `oauthService.logOut()`.
6a. **Präzisierungen aus dem Final Review** *(eigene Entscheidungen)*:
   - „Gültig“ heißt: Access-Token läuft noch mindestens 60 s (eigene Prüfung über `getAccessTokenExpiration()`; `hasValidAccessToken()` toleriert standardmäßig 600 s Clock-Skew).
   - **Offline bleibt die App, wie sie ist.** Nur eine eindeutige Ablehnung durch den Server (HTTP 400/401, `invalid_grant`) löst die Neuanmeldung aus. Netzwerkfehler oder `navigator.onLine === false` → nichts tun; erneuter Versuch bei `visible` oder `online`. Grund: die PWA ist offline-fähig, eine Weiterleitung auf die unerreichbare Login-Seite würde sie unbrauchbar machen.
   - Schlägt der automatische Refresh fehl, solange der Token noch gültig ist, wird die Session-Prüfung zum Ablaufzeitpunkt nachgeholt (Timer, wird bei neuem Token verworfen).
   - Bei gültigem Token meldet die App „angemeldet“ nur beim Wechsel von nicht angemeldet → angemeldet, damit nicht bei jedem App-Wechsel alle Daten neu geladen werden.
   - Fehlt das Discovery-Dokument (z. B. Kaltstart offline), lädt die Session-Prüfung es nach. `init()` wirft nie. Listener werden erst nach abgeschlossenem `tryLogin()` registriert (bzw. nach gescheitertem Discovery).
   - Nur eine Login-Weiterleitung gleichzeitig.
7. **Azure-Portal-Einstellungen** werden nicht per Code gemacht, sondern als Anleitung `azure-b2c-setup.md` im Story-Ordner beschrieben:
   - User Flow `B2C_1_SignUpSignIn` → *Application claims* → **Identity Provider** aktivieren (ohne diesen Claim greift Punkt 2/3 nicht; die App verhält sich dann wie heute).
   - *Properties → Session behavior*: Web app session lifetime **1440 min**, Timeout **Rolling**.
   - *Properties → Session behavior*: **Keep me signed in** aktivieren, **90 Tage** (wirkt nur für lokale Konten).

## Rahmen

- Nur Frontend: `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/src/app/core/auth.service.ts` plus neue `auth.service.spec.ts`. Öffentliche API des `AuthService` (`init`, `logout`, `loggedIn`, `userInfo`, `isLoggedIn`, `login`) bleibt erhalten.
- Bibliothek `angular-oauth2-oidc` 13.0.1 – APIs per Context7 geprüft: `refreshToken(): Promise`, `getRefreshToken()`, `initLoginFlow(additionalState = '', params = {})`, Event-Typ `token_refresh_error`, `getIdentityClaims()`, `logOut()`.
- Storage ist bereits `localStorage` (`app.module.ts`) – Tokens überleben das Schließen der PWA.
- Kein Backend-Change, kein UI-Change (Aussehen).

## Nicht-Ziele

- Backend-for-Frontend, eigene Login-Domain, Migration weg von B2C.
- Garantie, dass Google ohne Klick durchwinkt – das entscheidet Google (bestehende Google-Session in der PWA, ggf. Kontoauswahl).

## Dem Builder überlassen

- Name des `localStorage`-Keys (Vorschlag: `andaha.auth.lastIdp`).
- Ob die bestehende, ungenutzte `login()`-Methode unverändert bleibt (Vorgabe: unverändert lassen).
- Struktur der Unit-Tests (Jasmine/Karma, `OAuthService` gemockt).

## Verifikation

- Unit-Tests für AC1–AC6 (gemockter `OAuthService`).
- Playwright (ohne echte Credentials): App lokal starten, `localStorage` `andaha.auth.lastIdp = google.com` setzen, neu laden → Weiterleitung auf die B2C-Authorize-URL enthält `domain_hint=google.com`. Mit `?error=access_denied` in der URL → Weiterleitung **ohne** `domain_hint`, Key gelöscht.
- Echter Langzeittest (am nächsten Tag am Handy) durch den Nutzer nach Deployment + Portal-Einstellungen.
