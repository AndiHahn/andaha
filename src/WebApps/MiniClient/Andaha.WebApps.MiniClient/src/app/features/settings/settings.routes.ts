import { Routes } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SettingsComponent } from './settings.component';
import { AddConnectionDialogService } from './modules/connection/add-connection-dialog/add-connection-dialog.service';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'connections',
    pathMatch: 'full'
  },
  {
    path: '',
    component: SettingsComponent,
    // vorher die Provider des SettingsModule (inkl. MatDialog aus MatDialogModule)
    providers: [
      MatDialog,
      AddConnectionDialogService,
      {
        provide: 'dialog',
        useValue: MatDialog
      }
    ],
    children: [
      {
        path: 'connections',
        data: { title: 'Verbindungen' },
        loadComponent: () => import('./modules/connection/connection.component').then(m => m.ConnectionComponent)
      },
      {
        path: 'categories',
        data: { title: 'Kategorien' },
        loadChildren: () => import('./modules/categories/categories.routes').then(m => m.routes)
      }
    ]
  }
];
