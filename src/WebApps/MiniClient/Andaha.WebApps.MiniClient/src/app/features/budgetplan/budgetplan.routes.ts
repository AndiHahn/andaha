import { Routes } from '@angular/router';
import { BudgetplanComponent } from './budgetplan.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: '',
    component: BudgetplanComponent,
    children: [
      {
        path: 'overview',
        data: { title: 'Haushalt' },
        loadComponent: () => import('./modules/overview/overview.component').then(m => m.OverviewComponent)
      },
      {
        path: 'fixedcost',
        loadChildren: () => import('./modules/fixed-cost/fixed-cost.routes').then(m => m.routes)
      },
      {
        path: 'income',
        loadChildren: () => import('./modules/income/income.routes').then(m => m.routes)
      }
    ]
  }
];
