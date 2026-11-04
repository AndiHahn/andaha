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
import { ColorItemModule } from '../color-item/color-item.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShowErrorModule } from 'src/app/shared/form-field/show-error.module';

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
        ColorItemModule,
        MatProgressSpinnerModule,
        ShowErrorModule,
        CategoryItemDetailsComponent
    ],
})
export class CategoryItemDetailsModule { }
