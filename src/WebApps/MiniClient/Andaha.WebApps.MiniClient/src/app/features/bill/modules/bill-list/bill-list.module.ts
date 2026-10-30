import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillListComponent } from './bill-list.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { BillListFilterComponent } from './bill-list-filter/bill-list-filter.component';
import { MatIconModule } from '@angular/material/icon';
import { BillListItemComponent } from './bill-list-item/bill-list-item.component';
import { RouterModule, Routes } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
    MatPaginatorModule,
    MatProgressBarModule,
    MatIconModule,
    ScrollingModule,
    MatDialogModule
  ],
  providers: [],
  exports: [
    BillListFilterComponent,
    BillListItemComponent
  ]
})
export class BillListModule { }
