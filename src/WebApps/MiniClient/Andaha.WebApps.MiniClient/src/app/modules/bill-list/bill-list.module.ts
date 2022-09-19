import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillListComponent } from './bill-list.component';
import { MatListModule } from '@angular/material/list'
import { MatChipsModule } from '@angular/material/chips'
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BillListFilterComponent } from './bill-list-filter/bill-list-filter.component';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BillListItemComponent } from './bill-list-item/bill-list-item.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: BillListComponent
  }
];

@NgModule({
  declarations: [
    BillListComponent,
    BillListFilterComponent,
    BillListItemComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatListModule,
    MatChipsModule,
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatInputModule,
    MatChipsModule
  ]
})
export class BillListModule { }
