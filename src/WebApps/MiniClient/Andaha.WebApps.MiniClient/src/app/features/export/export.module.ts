import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportComponent } from './export.component';
import { RouterModule, Routes } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: 'overview',
    component: ExportComponent
  }
];

@NgModule({
  declarations: [
    ExportComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ]
})
export class ExportModule { }
