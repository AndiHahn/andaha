import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/bill/bill.module').then(m => m.BillModule)
  },
  {
    path: 'bill/create',
    loadChildren: () => import('./modules/add-bill/add-bill.module').then(m => m.AddBillModule)
  },
  {
    path: 'bill/list',
    loadChildren: () => import('./modules/bill-list/bill-list.module').then(m => m.BillListModule)
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
