import { Routes } from '@angular/router';
import { IncomeComponent } from './income.component';

export const routes: Routes = [
  {
    path: '',
    data: { title: 'Haushalt' },
    component: IncomeComponent
  },
  {
    path: 'create',
    data: { title: 'Einkommen hinzufügen', back: '/budgetplan/income' },
    loadComponent: () => import('./create-income/create-income.component').then(m => m.CreateIncomeComponent)
  },
  {
    path: ':id',
    data: { title: 'Einkommen', back: '/budgetplan/income' },
    loadComponent: () => import('./income-details/income-details.component').then(m => m.IncomeDetailsComponent)
  }
];
