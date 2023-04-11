import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryItemDetailsComponent } from './category-item-details.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox'
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ColorItemComponent } from '../color-item/color-item.component';
import { RouterModule, Routes } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { DragDropModule } from '@angular/cdk/drag-drop';

const routes: Routes = [
  {
    path: '',
    component: CategoryItemDetailsComponent
  }
];

@NgModule({
  declarations: [
    CategoryItemDetailsComponent,
    ColorItemComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatCheckboxModule,
    MatCardModule,
    DragDropModule
  ]
})
export class CategoryItemDetailsModule { }
