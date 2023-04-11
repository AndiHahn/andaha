import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoriesComponent } from './categories.component';
import { RouterModule, Routes } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
    path: ':id',
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
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressBarModule,
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
