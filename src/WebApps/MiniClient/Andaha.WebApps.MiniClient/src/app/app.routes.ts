import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/bill/bill.routes').then(m => m.routes)
  },
  {
    path: 'analyzed',
    loadChildren: () => import('./features/bill-analysis/bill-analysis.routes').then(m => m.routes)
  },
  {
    path: 'budgetplan',
    loadChildren: () => import('./features/budgetplan/budgetplan.routes').then(m => m.routes)
  },
  {
    path: 'work',
    loadChildren: () => import('./features/work/work.routes').then(m => m.routes)
  },
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.routes').then(m => m.routes)
  },
  {
    path: 'export',
    data: { title: 'Export' },
    loadChildren: () => import('./features/export/export.routes').then(m => m.routes)
  },
  {
    path: 'data-protection',
    data: { title: 'Datenschutzerklärung' },
    loadComponent: () => import('./features/data-protection/data-protection/data-protection.component').then(m => m.DataProtectionComponent)
  },
  {
    path: 'agb',
    data: { title: 'AGB' },
    loadComponent: () => import('./features/data-protection/agb/agb.component').then(m => m.AgbComponent)
  },
  {
    path: 'user-data',
    data: { title: 'Benutzerdaten' },
    loadComponent: () => import('./features/data-protection/user-data/user-data.component').then(m => m.UserDataComponent)
  }
];
