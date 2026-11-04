import { Routes } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { PersonDetailsComponent } from './person-details.component';

export const routes: Routes = [
  {
    path: '',
    // vorher MatDialogModule im PersonDetailsModule: eigene MatDialog-Instanz im Lazy-Injector
    providers: [MatDialog],
    children: [
      {
        path: '',
        component: PersonDetailsComponent
      },
      {
        path: 'working-entry/:entry-id',
        // vorher WorkEntryDetailsDialogModule mit MatDialogModule und TimePickerFormFieldModule
        providers: [
          MatDialog,
          importProvidersFrom(NgxMatTimepickerModule.setLocale('de-DE'))
        ],
        loadComponent: () => import('../work-entry-details/work-entry-details-dialog.component').then(m => m.WorkEntryDetailsDialogComponent)
      }
    ]
  }
];
