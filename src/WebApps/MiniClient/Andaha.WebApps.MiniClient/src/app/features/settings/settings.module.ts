import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SettingsComponent } from './settings.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
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
        loadChildren: () => import('./modules/connection/connection.module').then(m => m.ConnectionModule)
      },
      {
        path: 'categories',
        loadChildren: () => import('./modules/categories/categories.module').then(m => m.CategoriesModule)
      }
    ]
  }
];

@NgModule({
  declarations: [
    SettingsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule,
    MatToolbarModule,
    MatDialogModule
  ],
  exports: [ RouterModule ],
  providers: [
    AddConnectionDialogService,
    {
      provide: 'dialog',
      useValue: MatDialog
    }
  ]
})
export class SettingsModule { }