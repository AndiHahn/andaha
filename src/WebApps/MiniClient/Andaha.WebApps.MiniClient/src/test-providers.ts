import { provideZoneChangeDetection } from '@angular/core';

// Angular 21+: TestBed runs zoneless by default; the app boots with Zone.js (main.ts), so tests do too.
export default [provideZoneChangeDetection()];
