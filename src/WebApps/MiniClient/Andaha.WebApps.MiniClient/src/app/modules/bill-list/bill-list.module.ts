import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillListComponent } from './bill-list.component';
import { RouterModule, Routes } from '@angular/router';
import { MatListModule } from '@angular/material/list'
import { MatChipsModule } from '@angular/material/chips'
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator'

const routes: Routes = [
  {
    path: '',
    component: BillListComponent
  }
];

@NgModule({
  declarations: [
    BillListComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatListModule,
    MatChipsModule,
    MatButtonModule,
    MatPaginatorModule
  ]
})
export class BillListModule { }
