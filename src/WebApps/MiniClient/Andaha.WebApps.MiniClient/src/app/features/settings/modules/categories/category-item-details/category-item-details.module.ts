import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryItemDetailsComponent } from './category-item-details.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ColorItemComponent } from '../color-item/color-item.component';
import { RouterModule, Routes } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


const routes: Routes = [
  {
    path: '',
    component: CategoryItemDetailsComponent
  }
];

@NgModule({
    imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
    MatSelectModule,
    MatCheckboxModule,
    DragDropModule,
    MatProgressSpinnerModule,
    CategoryItemDetailsComponent
],
})
export class CategoryItemDetailsModule { }
