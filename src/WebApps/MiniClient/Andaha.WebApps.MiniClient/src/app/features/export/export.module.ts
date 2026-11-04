import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportComponent } from './export.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
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
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        ExportComponent
    ]
})
export class ExportModule { }
