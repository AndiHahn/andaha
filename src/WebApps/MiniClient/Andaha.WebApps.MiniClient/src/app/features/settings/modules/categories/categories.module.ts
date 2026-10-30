import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriesComponent } from './categories.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DragDropModule } from '@angular/cdk/drag-drop';

const routes: Routes = [
  {
    path: '',
    component: CategoriesComponent,
  },
  {
    path: 'create',
    data: { title: 'Kategorie hinzufügen', back: '/settings/categories' },
    loadChildren: () => import('./create-category/create-category.module').then(m => m.CreateCategoryModule)
  },
  {
    path: ':id',
    data: { title: 'Kategorie', back: '/settings/categories' },
    loadChildren: () => import('./category-item-details/category-item-details.module').then(m => m.CategoryItemDetailsModule)
  }
];

@NgModule({
  declarations: [
    CategoriesComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    DragDropModule
  ],
  providers: [
    ConfirmationDialogService,
    {
      provide: 'dialog',
      useValue: MatDialog
    }
  ]
})
export class CategoriesModule { }
