import { Provider } from '@angular/core';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import moment from 'moment';
import 'moment/locale/de';

// Der Application Builder (esbuild) buendelt die Moment-Locales nicht mehr automatisch (webpack lud
// ./locale/* per require-Kontext), daher Deutsch explizit laden. Das Laden setzt die globale Sprache
// auf de; global bleibt wie bisher en, der Adapter nutzt de ueber MAT_DATE_LOCALE.
moment.locale('en');

export const GERMAN_DATE_FORMATS = {
  parse: {
    dateInput: 'L',
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'DD.MM.YYYY',
    monthYearA11yLabel: 'MMMM YYYY'
  },
};

// Moment adapter with the German locale, so typed dates are parsed as DD.MM.YYYY.
export const GERMAN_DATE_PROVIDERS: Provider[] = [
  { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
  {
    provide: DateAdapter,
    useClass: MomentDateAdapter,
    deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
  },
  { provide: MAT_DATE_FORMATS, useValue: GERMAN_DATE_FORMATS },
];
