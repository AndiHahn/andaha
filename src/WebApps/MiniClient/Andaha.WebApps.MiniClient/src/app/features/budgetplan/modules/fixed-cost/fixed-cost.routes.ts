import { Routes } from '@angular/router';
import { FixedCostComponent } from './fixed-cost.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Fixkosten' },
    component: FixedCostComponent
  },
  {
    path: 'create',
    data: { title: 'Fixkosten hinzufügen', back: '/budgetplan/fixedcost' },
    loadComponent: () => import('./create-fixed-cost/create-fixed-cost.component').then(m => m.CreateFixedCostComponent)
  },
  {
    path: ':id',
    data: { title: 'Fixkosten', back: '/budgetplan/fixedcost' },
    loadComponent: () => import('./fixed-cost-details/fixed-cost-details.component').then(m => m.FixedCostDetailsComponent)
  }
];
