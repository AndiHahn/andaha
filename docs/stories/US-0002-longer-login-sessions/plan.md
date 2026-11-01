# Längere Login-Sessions (US-0002) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Der MiniClient löst beim Start/Fortsetzen zuerst den Refresh-Token ein und springt bei nötiger Neuanmeldung per `domain_hint` direkt zum zuletzt genutzten Login-Anbieter (z. B. Google), statt täglich die B2C-Auswahlseite zu zeigen.

**Architecture:** Alle Logik bleibt in `AuthService` (`src/app/core/auth.service.ts`). Eine zentrale Methode `ensureSession()` (gültig → fertig; Refresh-Token → `refreshToken()`; sonst `startLogin()`) wird beim Start, bei `visibilitychange → visible` und (als Login-Fallback) bei `token_refresh_error` verwendet. Der Anbieter wird aus dem `idp`-Claim in `localStorage` gemerkt.

**Tech Stack:** Angular 14, `angular-oauth2-oidc` 13.0.1, Jasmine/Karma (ChromeHeadless). Azure AD B2C User Flow `B2C_1_SignUpSignIn`.

**Spec:** [design.md](./design.md), Akzeptanzkriterien in [story.md](./story.md)

Frontend-Pfad (im Folgenden `<FE>`): `src/WebApps/MiniClient/Andaha.WebApps.MiniClient`

## Global Constraints

- Kein Backend-Change, kein Change am Aussehen; nur `<FE>/src/app/core/auth.service.ts` (+ neue Spec) und Doku im Story-Ordner.
- Öffentliche API von `AuthService` bleibt erhalten: `init`, `login`, `logout`, `isLoggedIn`, `loggedIn`, `userInfo`. `init()` darf künftig `Promise<void>` zurückgeben (Aufrufer in `app.module.ts` bleibt unverändert).
- Die bestehende, ungenutzte `login()`-Methode bleibt unverändert.
- `localStorage`-Key für den gemerkten Anbieter: exakt `andaha.auth.lastIdp`. Wert = `idp`-Claim verbatim (z. B. `google.com`, `facebook.com`).
- Login-Parameter: `oauthService.initLoginFlow('', { domain_hint: <idp> })` mit gemerktem Anbieter, sonst `oauthService.initLoginFlow('', {})`.
- Library-APIs (per Context7 geprüft, bei Zweifel dort nachschlagen: `/manfredsteyer/angular-oauth2-oidc`): `refreshToken(): Promise<TokenResponse>`, `getRefreshToken(): string`, `hasValidAccessToken()`, `getIdentityClaims()`, `tryLogin(): Promise` (lehnt bei `error`-Parameter mit `OAuthErrorEvent('code_error')` ab), `events: Observable<OAuthEvent>` mit Typ `'token_refresh_error'`, `logOut()`.
- Commits: keine – der Nutzer entscheidet am Ende über Commit/PR.
- Gate pro Task: `npx ng test --watch=false --browsers=ChromeHeadless` (in `<FE>`) → alle Tests grün (Baseline: 15/15), sowie `npx ng build` ohne Fehler.

## Review Focus

- Gleichzeitige Session-Prüfungen (z. B. zwei `visibilitychange` kurz hintereinander, oder Visibility + Refresh-Fehler) → genau ein `refreshToken()`-Aufruf / höchstens eine Weiterleitung. Test in Task 1.
- `visibilitychange`, bevor das Discovery-Dokument geladen ist → darf nichts auslösen (Listener erst nach `loadDiscoveryDocument` registrieren). Test in Task 1.
- Erfolgreicher Refresh beim Start → `loggedIn()` emittiert `true` **und** `userInfo()` liefert Name/E-Mail (heute nur im Login-Pfad). Test in Task 1.
- `token_refresh_error` während der Access-Token noch gültig ist (Refresh bei 75 % Laufzeit) → keine Weiterleitung mitten in der Bedienung. Test in Task 1.
- Login-Fehler mit gemerktem Anbieter → genau eine Weiterleitung ohne Hint; ohne gemerkten Anbieter → keine. Test in Task 1.

---

### Task 1: Session-Logik im AuthService

UI-relevant: **ja** (Frontend-State/Auth-Flow, kein visueller Change) → Phase 4 prüft die Weiterleitung per Playwright.

**Files:**
- Modify: `<FE>/src/app/core/auth.service.ts`
- Create: `<FE>/src/app/core/auth.service.spec.ts`

**Interfaces:**
- Consumes: `OAuthService` (angular-oauth2-oidc), `environment` (unverändert).
- Produces (öffentlich): `init(): Promise<void>`, `logout(): void`, Rest unverändert.
- Private Helfer (Namen verbindlich, damit Review/Tests konsistent sind):
  - `private static readonly lastIdpKey = 'andaha.auth.lastIdp'`
  - `private ensureSession(): Promise<void>` – gültiger Access-Token → `markAuthenticated()`; sonst wenn `getRefreshToken()` → `refreshToken()` dann `markAuthenticated()`, bei Fehler `startLogin()`; sonst `startLogin()`. Läuft bereits eine Prüfung, wird deren Promise zurückgegeben (kein Parallel-Lauf).
  - `private startLogin(): void` – liest `lastIdpKey`, ruft `initLoginFlow` gemäß Global Constraints.
  - `private markAuthenticated(): void` – `isAuthenticated$.next(true)`, `rememberIdp()`, `buildAndRaiseAuthInfo()`.
  - `private rememberIdp(): void` – `idp` aus `getIdentityClaims()`; vorhanden → speichern, fehlt → Key entfernen.
  - `private handleLoginError(): void` – Key vorhanden → entfernen + `startLogin()`; sonst nichts.

**Ablauf `init()`:** `configure(...)` und `setupAutomaticSilentRefresh()` wie bisher; `events` abonnieren: `token_refresh_error` && `!hasValidAccessToken()` → `ensureSession()`. Dann `loadDiscoveryDocument(url)` → `tryLogin()` → `ensureSession()`; Ablehnung von `tryLogin()` → `handleLoginError()`. Erst nach geladenem Discovery-Dokument `document.addEventListener('visibilitychange', …)` registrieren: bei `document.visibilityState === 'visible'` → `ensureSession()`.

Test-Setup: `OAuthService` als `jasmine.createSpyObj` mit `events: new Subject<OAuthEvent>()`; `loadDiscoveryDocument`/`tryLogin` resolven standardmäßig; `getIdentityClaims` liefert `{ name: 'Andi', emails: ['andi@example.com'], idp: 'google.com' }`. `TestBed` mit `{ provide: OAuthService, useValue: spy }`. `localStorage.removeItem('andaha.auth.lastIdp')` in `beforeEach` und `afterEach`. Tests rufen `await service.init()`; für Event-getriebene Fälle danach Microtasks flushen (`fakeAsync` + `flushMicrotasks()` oder `await Promise.resolve()`).

- [ ] **Step 1: Failing tests schreiben** in `auth.service.spec.ts` (`describe('AuthService')`):
  - `does not start a login flow when the access token is still valid` – `hasValidAccessToken` → true; erwartet `initLoginFlow` und `refreshToken` nicht aufgerufen, `loggedIn()` emittiert `true`.
  - `redeems the refresh token at startup when the access token expired` – `hasValidAccessToken` → false, `getRefreshToken` → `'rt'`, `refreshToken` resolved; erwartet `refreshToken` 1×, `initLoginFlow` nicht, `loggedIn()` → `true`, `userInfo()` → `{ userName: 'Andi', userEmail: 'andi@example.com' }`.
  - `starts the login flow with the remembered idp as domain_hint when the refresh fails` – `localStorage['andaha.auth.lastIdp']='google.com'`, `refreshToken` rejected; erwartet `initLoginFlow('', { domain_hint: 'google.com' })`.
  - `starts the login flow without hint when no idp is remembered` – kein Refresh-Token, kein Key; erwartet `initLoginFlow('', {})`.
  - `remembers the idp claim after a successful login` – gültiger Token; erwartet Key = `'google.com'`.
  - `forgets the idp for local accounts` – Key vorher `'google.com'`, Claims ohne `idp`; erwartet Key `null`.
  - `drops the remembered idp and redirects once without hint when the login response has an error` – `tryLogin` rejected, Key `'google.com'`; erwartet Key `null`, `initLoginFlow` genau 1× mit `('', {})`.
  - `does not redirect after a login error when no idp is remembered` – `tryLogin` rejected, kein Key; erwartet `initLoginFlow` nicht aufgerufen.
  - `starts the session check on token_refresh_error when the access token is no longer valid` – nach `init` (gültig), dann `hasValidAccessToken` → false, kein Refresh-Token, Key `'google.com'`; `events.next(new OAuthErrorEvent('token_refresh_error', {}))`; erwartet `initLoginFlow('', { domain_hint: 'google.com' })`.
  - `ignores token_refresh_error while the access token is still valid` – erwartet `initLoginFlow` nicht aufgerufen.
  - `checks the session when the app becomes visible again` – nach `init` (gültig): `hasValidAccessToken` → false, `getRefreshToken` → `'rt'`, `spyOnProperty(document, 'visibilityState').and.returnValue('visible')`, `document.dispatchEvent(new Event('visibilitychange'))`; erwartet `refreshToken` 1×.
  - `runs only one session check at a time` – wie oben, aber `refreshToken` liefert ein noch offenes Promise, zwei `visibilitychange`-Events; erwartet `refreshToken` 1×.
  - `ignores visibilitychange before the discovery document is loaded` – `loadDiscoveryDocument` liefert offenes Promise, `init()` nicht awaiten, Event dispatchen; erwartet `refreshToken` und `initLoginFlow` nicht aufgerufen.
  - `logout forgets the remembered idp` – Key `'google.com'`, `logout()`; erwartet Key `null`, `logOut` 1×.

- [ ] **Step 2: Tests laufen lassen, Fehlschlag prüfen**
  Run (in `<FE>`): `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/core/auth.service.spec.ts`
  Expected: FAIL (u. a. `refreshToken` nie aufgerufen, Key nicht gesetzt).

- [ ] **Step 3: `AuthService` gemäß Interfaces/Ablauf umbauen** in `auth.service.ts`. Event-Filter per `rxjs` `filter(e => e.type === 'token_refresh_error')`. Kein Change an `getCodeFlowConfig()`, `buildAndRaiseAuthInfo()`, `login()`.

- [ ] **Step 4: Tests grün**
  Run: `npx ng test --watch=false --browsers=ChromeHeadless --include src/app/core/auth.service.spec.ts`
  Expected: alle 14 Tests PASS.

- [ ] **Step 5: Gesamtgate**
  Run: `npx ng test --watch=false --browsers=ChromeHeadless` → `TOTAL: 29 SUCCESS` (15 Baseline + 14 neu); `npx ng build` → ohne Fehler.

### Task 2: Anleitung Azure-Portal-Einstellungen

UI-relevant: nein.

**Files:**
- Create: `docs/stories/US-0002-longer-login-sessions/azure-b2c-setup.md`

**Interfaces:**
- Consumes: Key-/Claim-Namen aus Global Constraints (`idp`, `domain_hint`).

- [ ] **Step 1: Anleitung schreiben** (Deutsch, Schritt-für-Schritt, Azure-Portal → Azure AD B2C → User flows → `B2C_1_SignUpSignIn`):
  1. *Application claims* → **Identity Provider** anhaken → Speichern (Pflicht; ohne ihn kein `idp`-Claim, App verhält sich wie bisher).
  2. *Properties → Session behavior*: Web app session lifetime **1440** Minuten, Web app session timeout **Rolling**.
  3. *Properties → Session behavior*: **Enable keep me signed in session** an, **90** Tage (wirkt nur für lokale Konten).
  4. Prüfen: einmal neu anmelden (mit Google), dann in den DevTools `localStorage['andaha.auth.lastIdp']` → `google.com`; alternativ ID-Token auf jwt.ms prüfen (`idp`-Claim).
  5. Erwartetes Verhalten nach Deployment (Tabelle: < 24 h → keine Weiterleitung; > 24 h → kurzer Durchlauf B2C → Google ohne B2C-Seite; Google fragt ggf. Kontoauswahl; Logout → wieder B2C-Seite).
  6. Quellen-Links (Microsoft Learn: configure-tokens, session-behavior, direct-signin).

- [ ] **Step 2: Review** – Links/Begriffe gegen `design.md` abgleichen; Portal-Bezeichnungen per Context7 (`/websites/learn_microsoft_en-us_azure_active-directory-b2c`) verifizieren.
