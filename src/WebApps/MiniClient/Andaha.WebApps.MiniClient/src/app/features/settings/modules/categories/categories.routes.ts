import { Routes } from '@angular/router';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { CategoriesComponent } from './categories.component';

export const routes: Routes = [
  {
    path: '',
    // vorher die Provider des CategoriesModule, gelten fuer alle Kategorie-Routen
    providers: [ConfirmationDialogService],
    children: [
      {
        path: '',
        component: CategoriesComponent
      },
      {
        path: 'create',
        data: { title: 'Kategorie hinzufügen', back: '/settings/categories' },
        loadComponent: () => import('./create-category/create-category.component').then(m => m.CreateCategoryComponent)
      },
      {
        path: ':id',
        data: { title: 'Kategorie', back: '/settings/categories' },
        loadComponent: () => import('./category-item-details/category-item-details.component').then(m => m.CategoryItemDetailsComponent)
      }
    ]
  }
];
