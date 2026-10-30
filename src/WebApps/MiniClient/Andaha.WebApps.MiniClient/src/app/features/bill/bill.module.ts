import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillComponent } from './bill.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

const routes: Routes = [
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
        loadChildren: () => import('./modules/bill-list/bill-list.module').then(m => m.BillListModule)
      },
      {
        path: 'bill/create',
        data: { title: 'Rechnung hinzufügen' },
        loadChildren: () => import('./modules/add-bill/add-bill.module').then(m => m.AddBillModule)
      },
      {
        path: 'bill/expenses',
        data: { title: 'Statistik' },
        loadChildren: () => import('./modules/expenses/expenses.module').then(m => m.ExpensesModule)
      },
      {
        path: 'bill/:id',
        data: { title: 'Rechnung', back: '/bill/list' },
        loadChildren: () => import('./modules/bill-details/bill-details.module').then(m => m.BillDetailsModule)
      }
    ]
  }
];

@NgModule({
  declarations: [
    BillComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    MatIconModule
  ],
  exports: [ RouterModule ]
})
export class BillModule { }