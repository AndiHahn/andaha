import { Routes } from '@angular/router';
import { BillComponent } from './bill.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'bill/list',
    pathMatch: 'full'
  },
  {
    path: '',
    component: BillComponent,
    children: [
      {
        path: 'bill/list',
        data: { title: 'Rechnungen' },
        loadComponent: () => import('./modules/bill-list/bill-list.component').then(m => m.BillListComponent)
      },
      {
        path: 'bill/create',
        data: { title: 'Rechnung hinzufügen', back: '/bill/list' },
        loadComponent: () => import('./modules/add-bill/add-bill.component').then(m => m.AddBillComponent)
      },
      {
        path: 'bill/expenses',
        data: { title: 'Rechnungen' },
        loadComponent: () => import('./modules/expenses/expenses.component').then(m => m.ExpensesComponent)
      },
      {
        // Analyse-Tab, vor bill/:id registriert
        path: 'bill/analysis',
        loadChildren: () => import('../bill-analysis/bill-analysis.routes').then(m => m.routes)
      },
      {
        path: 'bill/:id',
        data: { title: 'Rechnung', back: '/bill/list' },
        loadComponent: () => import('./modules/bill-details/bill-details.component').then(m => m.BillDetailsComponent)
      }
    ]
  }
];
