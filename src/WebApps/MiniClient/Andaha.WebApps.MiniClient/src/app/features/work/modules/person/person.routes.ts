import { Routes } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { PersonComponent } from './person.component';

export const routes: Routes = [
  {
    path: '',
    component: PersonComponent
  },
  {
    path: 'create',
    data: { title: 'Person hinzufügen', back: '/work/person' },
    loadComponent: () => import('./add-person/add-person.component').then(m => m.AddPersonComponent)
  },
  {
    path: 'create-working-entry',
    data: { title: 'Arbeitszeiten hinzufügen', back: '/work/person' },
    // vorher ueber TimePickerFormFieldModule: deutsches Zeitformat im Timepicker
    providers: [importProvidersFrom(NgxMatTimepickerModule.setLocale('de-DE'))],
    loadComponent: () => import('./add-working-entry/add-working-entry.component').then(m => m.AddWorkingEntryComponent)
  },
  {
    path: ':id',
    data: { title: 'Person', back: '/work/person' },
    loadChildren: () => import('./person-details/person-details.routes').then(m => m.routes)
  }
];
