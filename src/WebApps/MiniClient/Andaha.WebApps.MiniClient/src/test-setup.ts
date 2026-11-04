import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';

// app.config.ts registers 'de' for the app; each Vitest file runs isolated, so register it here for the specs.
registerLocaleData(localeDe, 'de');

// Jasmine removed spies after every spec; Vitest keeps vi.spyOn spies until restored.
afterEach(() => {
  vi.restoreAllMocks();
});
