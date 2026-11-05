import { Routes } from '@angular/router';
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
        loadComponent: () => import('../work-entry-details/work-entry-details-dialog.component').then(m => m.WorkEntryDetailsDialogComponent)
      }
    ]
  }
];
