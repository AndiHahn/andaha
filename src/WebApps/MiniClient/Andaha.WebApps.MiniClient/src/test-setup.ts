import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import { cdp } from 'vitest/browser';

// app.config.ts registers 'de' for the app; each Vitest file runs isolated, so register it here for the specs.
registerLocaleData(localeDe, 'de');

// Feste Zeitzone für Datums-Specs (z. B. Rechnung um 23:30, Monatserster 00:30), unabhängig vom Rechner.
// Die Umgebungsvariable TZ erreicht Chromium unter Windows nicht, und die Playwright-Option timezoneId
// lässt sich über den Angular-Builder nicht setzen; darum per CDP (Playwright-Provider mit Chromium).
// Gilt ab den Hooks und Tests, nicht für Datumswerte, die schon beim Sammeln im describe-Rumpf entstehen.
// `send` kommt aus den Typen von @vitest/browser-playwright; die ziehen Node-Typen nach, die mit den
// Browser-Typen der Specs kollidieren (setTimeout), darum hier nur die eine Signatur.
type CdpSession = { send(method: string, params?: object): Promise<unknown> };

beforeAll(async () => {
  await (cdp() as unknown as CdpSession).send('Emulation.setTimezoneOverride', { timezoneId: 'Europe/Vienna' });
});

// Jasmine removed spies after every spec; Vitest keeps vi.spyOn spies until restored.
afterEach(() => {
  vi.restoreAllMocks();
});
