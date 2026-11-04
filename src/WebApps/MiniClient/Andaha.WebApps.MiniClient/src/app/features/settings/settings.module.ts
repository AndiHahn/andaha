import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from './settings.component';
import { MatIconModule } from '@angular/material/icon';
import { AddConnectionDialogService } from './modules/connection/add-connection-dialog/add-connection-dialog.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'connections',
    pathMatch: 'full'
  },
  {
    path: '',
    component: SettingsComponent,
    children: [
      {
        path: 'connections',
        data: { title: 'Verbindungen' },
        loadChildren: () => import('./modules/connection/connection.module').then(m => m.ConnectionModule)
      },
      {
        path: 'categories',
        data: { title: 'Kategorien' },
        loadChildren: () => import('./modules/categories/categories.module').then(m => m.CategoriesModule)
      }
    ]
  }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        MatIconModule,
        MatDialogModule,
        SettingsComponent
    ],
    exports: [RouterModule],
    providers: [
        AddConnectionDialogService,
        {
            provide: 'dialog',
            useValue: MatDialog
        }
    ]
})
export class SettingsModule { }