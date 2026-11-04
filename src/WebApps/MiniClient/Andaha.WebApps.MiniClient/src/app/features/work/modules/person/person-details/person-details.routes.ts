import { Routes } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { PersonDetailsComponent } from './person-details.component';

export const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: PersonDetailsComponent
      },
      {
        path: 'working-entry/:entry-id',
        // vorher TimePickerFormFieldModule im WorkEntryDetailsDialogModule (deutsches Zeitformat)
        providers: [importProvidersFrom(NgxMatTimepickerModule.setLocale('de-DE'))],
        loadComponent: () => import('../work-entry-details/work-entry-details-dialog.component').then(m => m.WorkEntryDetailsDialogComponent)
      }
    ]
  }
];
