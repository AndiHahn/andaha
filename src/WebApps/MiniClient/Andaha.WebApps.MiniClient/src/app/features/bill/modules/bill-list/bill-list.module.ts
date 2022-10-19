import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillListComponent } from './bill-list.component';
import { MatChipsModule } from '@angular/material/chips'
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BillListFilterComponent } from './bill-list-filter/bill-list-filter.component';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BillListItemComponent } from './bill-list-item/bill-list-item.component';
import { RouterModule, Routes } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatDividerModule } from '@angular/material/divider';
import { BillOptionsDialogService } from './bill-options-dialog/bill-options-dialog.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { HoldableDirectiveModule } from 'src/app/shared/directives/holdable-directive/holdable-directive.module';

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
    MatButtonModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatInputModule,
    MatChipsModule,
    MatDividerModule,
    ScrollingModule,
    MatDialogModule,
    HoldableDirectiveModule
  ],
  providers: [
    BillOptionsDialogService,
    {
      provide: 'dialog',
      useValue: MatDialog
    }
  ]
})
export class BillListModule { }
