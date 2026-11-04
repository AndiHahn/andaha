import { Routes } from '@angular/router';
import { WorkComponent } from './work.component';
import { WorkingEntriesContextService } from './services/working-entries-context.service';

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
        data: { title: 'Stundenaufzeichnungen' },
        // vorher providedIn: PersonModule, gilt fuer alle Personen-Routen
        providers: [WorkingEntriesContextService],
        loadChildren: () => import('./modules/person/person.routes').then(m => m.routes)
      },
      {
        path: 'statistics',
        data: { title: 'Statistik' },
        loadComponent: () => import('./modules/statistics/statistics.component').then(m => m.StatisticsComponent)
      }
    ]
  }
];
