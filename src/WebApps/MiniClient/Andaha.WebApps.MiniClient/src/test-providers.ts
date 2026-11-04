import { provideZoneChangeDetection } from '@angular/core';

// Angular 21+: TestBed runs zoneless by default; the app boots with Zone.js (app.config.ts), so tests do too.
export default [provideZoneChangeDetection()];
