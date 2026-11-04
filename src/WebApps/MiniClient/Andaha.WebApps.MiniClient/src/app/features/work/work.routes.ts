import { Routes } from '@angular/router';
import { WorkComponent } from './work.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'person',
    pathMatch: 'full'
  },
  {
    path: '',
    component: WorkComponent,
    children: [
      {
        path: 'person',
        data: { title: 'Stunden' },
        loadChildren: () => import('./modules/person/person.routes').then(m => m.routes)
      },
      {
        path: 'statistics',
        data: { title: 'Stunden' },
        loadComponent: () => import('./modules/statistics/statistics.component').then(m => m.StatisticsComponent)
      }
    ]
  }
];
