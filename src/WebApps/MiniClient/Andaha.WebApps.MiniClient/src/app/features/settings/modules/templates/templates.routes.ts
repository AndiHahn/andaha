import { Routes } from '@angular/router';
import { ConfirmationDialogService } from 'src/app/shared/confirmation-dialog/confirmation-dialog.service';
import { TemplateListComponent } from './template-list/template-list.component';

export const routes: Routes = [
  {
    path: '',
    providers: [ConfirmationDialogService],
    children: [
      {
        path: '',
        component: TemplateListComponent
      },
      {
        path: 'create',
        data: { title: 'Vorlage hinzufügen', back: '/settings/templates' },
        loadComponent: () => import('./template-edit/template-edit.component').then(m => m.TemplateEditComponent)
      },
      {
        path: ':id',
        data: { title: 'Vorlage bearbeiten', back: '/settings/templates' },
        loadComponent: () => import('./template-edit/template-edit.component').then(m => m.TemplateEditComponent)
      }
    ]
  }
];
