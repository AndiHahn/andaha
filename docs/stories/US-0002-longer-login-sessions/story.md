# US-0002: Längere Login-Sessions im MiniClient

| Field | Value |
|-------|-------|
| ID | US-0002 |
| Status | In Review <!-- Open / In Progress / In Review / Done --> |
| Created | 2026-11-01 |
| Design Doc | [design.md](./design.md) |
| Plan | [plan.md](./plan.md) |

## Description

Als Nutzer:in des MiniClients (hauptsächlich als PWA am Handy, selten im Browser am PC) möchte ich mich nicht jeden Tag neu anmelden müssen, sodass ich die App öffnen und direkt verwenden kann – im Idealfall muss ich nur noch etwa 1x im Monat (oder seltener) aktiv etwas eingeben.

**Ist-Zustand:** Jeden Morgen erscheint die Azure-AD-B2C-Login-Seite (lokales Konto + Google/Facebook-Buttons). Ursachen:

- Azure AD B2C stellt Single-Page-Apps (Code Flow + PKCE) Refresh-Tokens mit **fixer Laufzeit von 24 h** aus – nicht konfigurierbar.
- Die B2C-Session (SSO-Cookie) läuft ohne „Angemeldet bleiben“ nach max. 24 h ab; „Angemeldet bleiben“ (KMSI) gilt laut Microsoft **nur für lokale Konten**, nicht für Google/Facebook.
- `auth.service.ts` probiert beim App-Start den Refresh-Token nicht, sondern leitet bei abgelaufenem Access-Token (nach 1 h) sofort zum Login weiter.

**Lösung (vereinbart, Variante „A+“):** Der Client nutzt den Refresh-Token konsequent und merkt sich den zuletzt verwendeten Login-Anbieter (`idp`-Claim). Ist eine Neuanmeldung nötig, leitet er mit `domain_hint` direkt zu diesem Anbieter weiter, sodass die B2C-Auswahlseite übersprungen wird und Google bei bestehender Google-Session still durchwinkt.

## Acceptance Criteria

- [x] AC1: Beim Start der App mit abgelaufenem Access-Token, aber vorhandenem Refresh-Token, wird zuerst still der Refresh-Token eingelöst. Gelingt das, gibt es keine Weiterleitung und die App ist sofort angemeldet.
- [x] AC2: Nach jedem erfolgreichen Login merkt sich die App den Login-Anbieter aus dem `idp`-Claim (z. B. `google.com`, `facebook.com`). Bei einem lokalen Konto (kein `idp`-Claim) wird nichts gemerkt bzw. ein gemerkter Wert entfernt.
- [x] AC3: Ist eine Neuanmeldung nötig (kein/abgelaufener Refresh-Token) und ein Anbieter gemerkt, wird mit `domain_hint=<idp>` zu B2C weitergeleitet, sodass die B2C-Login-Seite übersprungen wird. Ohne gemerkten Anbieter verhält sich der Login wie bisher.
- [x] AC4: Schlägt der automatische Refresh während die App offen ist fehl, oder kommt die PWA mit abgelaufenem Access-Token aus dem Hintergrund zurück, wird zuerst der Refresh-Token probiert und sonst die Neuanmeldung nach AC3 gestartet (kein „hängender“ Zustand mit ungültigem Token).
- [x] AC5: Kommt die Login-Antwort mit einem Fehler zurück (z. B. Abbruch bei Google), wird der gemerkte Anbieter verworfen und die normale B2C-Login-Seite angezeigt. War kein Anbieter gemerkt, wird nicht automatisch weitergeleitet – keine Weiterleitungsschleife.
- [x] AC6: Beim Ausloggen wird der gemerkte Anbieter gelöscht; der nächste Login zeigt wieder die B2C-Auswahlseite.
- [x] AC7: Eine Anleitung für die nötigen Azure-Portal-Einstellungen liegt im Story-Ordner (`azure-b2c-setup.md`): Claim *Identity Provider* im User Flow aktiv, Session-Verhalten (24 h, rollierend), „Angemeldet bleiben“ für lokale Konten (90 Tage).
- [x] AC8: Unit-Tests für `AuthService` decken AC1–AC6 ab und laufen grün.

## Technical Notes

- Betroffen: `src/WebApps/MiniClient/Andaha.WebApps.MiniClient/src/app/core/auth.service.ts` (+ Spec). Kein Backend-Change.
- Bibliothek: `angular-oauth2-oidc` 13.0.1 (`refreshToken()`, `initLoginFlow(additionalState, params)`, Event `token_refresh_error`).
- B2C `domain_hint` und `idp`-Claim: siehe [design.md](./design.md).
- Der alte Duende-IdentityServer (`src/Services/Identity/Config.cs`, `AccessTokenLifetime = 1 Monat`) wird vom MiniClient nicht verwendet und bleibt unverändert.

## Out of Scope

- Backend-for-Frontend (Refresh-Tokens serverseitig, ohne 24-h-Grenze)
- Umstellung auf eigene Login-Domain (`login.andaha.work`) für Silent-Refresh per iframe
- Migration weg von Azure AD B2C
- Änderungen am Aussehen der App

## UI Verification

**2026-11-01 – PASSED** (Playwright MCP, `ng serve` lokal, ohne Backend und ohne Credentials; echte B2C-/Google-Endpunkte):

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Ohne gemerkten Anbieter → B2C-Auswahlseite, kein `domain_hint` | PASS | `ui-testing/b2c-selection-page.png` |
| 2 | `andaha.auth.lastIdp=google.com` → Authorize-URL mit `domain_hint=google.com`, B2C leitet direkt zu `accounts.google.com` | PASS | `ui-testing/google-direct.png` |
| 3 | `?error=access_denied` mit gemerktem Anbieter → Key gelöscht, genau 1 Weiterleitung ohne Hint | PASS | |
| 4 | `?error=access_denied` ohne gemerkten Anbieter → keine Weiterleitung | PASS | |
| 5 | Gültiger Token beim Start → keine Weiterleitung, kein Token-Call | PASS | |
| 6 | Offline + abgelaufener Token + `visibilitychange` → App bleibt, keine Navigation | PASS | |
| 7 | Wieder online → Refresh an B2C (400 für Fake-Refresh-Token) → Neuanmeldung mit `domain_hint=google.com` → Google | PASS | |

Konsolenfehler nur durch fehlendes Backend (`localhost:8900`) und die erwarteten Refresh-Fehler der Library; keine unbehandelten Fehler aus dem Auth-Code. Echter Langzeittest (> 24 h, PWA am Handy) steht nach Deployment + Portal-Einstellungen beim Nutzer aus.

## AI Usage

See [ai-usage.md](./ai-usage.md).
