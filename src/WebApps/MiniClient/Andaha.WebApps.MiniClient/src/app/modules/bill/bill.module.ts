import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BillComponent } from './bill.component';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';

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
        loadChildren: () => import('../../modules/bill-list/bill-list.module').then(m => m.BillListModule)
      },
      {
        path: 'bill/create',
        loadChildren: () => import('../../modules/add-bill/add-bill.module').then(m => m.AddBillModule)
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
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
  ],
  exports: [ RouterModule ]
})
export class BillModule { }