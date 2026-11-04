import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginatorModule } from '@angular/material/paginator';
import { RouterModule, Routes } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { AnalyzedBillListComponent } from './analyzed-bill-list.component';
import { AnalyzedBillListItemComponent } from './analyzed-bill-list-item/analyzed-bill-list-item.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';

const routes: Routes = [
  { path: '', component: AnalyzedBillListComponent }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        MatPaginatorModule,
        MatProgressBarModule,
        ScrollingModule,
        AnalyzedBillListComponent, AnalyzedBillListItemComponent
    ]
})
export class AnalyzedBillListModule { }
