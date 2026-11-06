import { Routes } from '@angular/router';

export const routes: Routes = [
  // Scans (Route /bill/analysis) ist ein Tab unter Rechnungen (v2); alte Analyse-URLs (Lesezeichen, installierte PWA) leiten um
  { path: 'analyzed', pathMatch: 'full', redirectTo: '/bill/analysis' },
  { path: 'analyzed/list', redirectTo: '/bill/analysis' },
  { path: 'analyzed/create', redirectTo: '/bill/list' },
  { path: 'analyzed/:id', redirectTo: '/bill/analysis/:id' },
  {
    path: '',
    loadChildren: () => import('./features/bill/bill.routes').then(m => m.routes)
  },
  {
    path: 'more',
    data: { title: 'Mehr' },
    loadComponent: () => import('./core/navigation/more-page/more-page.component').then(m => m.MorePageComponent)
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
    data: { title: 'Export', back: '/more' },
    loadChildren: () => import('./features/export/export.routes').then(m => m.routes)
  },
  {
    path: 'data-protection',
    data: { title: 'Datenschutzerklärung', back: '/more' },
    loadComponent: () => import('./features/data-protection/data-protection/data-protection.component').then(m => m.DataProtectionComponent)
  },
  {
    path: 'agb',
    data: { title: 'AGB', back: '/more' },
    loadComponent: () => import('./features/data-protection/agb/agb.component').then(m => m.AgbComponent)
  },
  {
    path: 'user-data',
    data: { title: 'Benutzerdaten', back: '/more' },
    loadComponent: () => import('./features/data-protection/user-data/user-data.component').then(m => m.UserDataComponent)
  }
];
