import { Routes } from '@angular/router';
import { ExportComponent } from './export.component';

export const routes: Routes = [
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
