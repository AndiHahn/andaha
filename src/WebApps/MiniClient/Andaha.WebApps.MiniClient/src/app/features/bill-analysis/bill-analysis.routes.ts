import { Routes } from '@angular/router';
import { BillAnalysisComponent } from './bill-analysis.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: '',
    component: BillAnalysisComponent,
    children: [
      {
        path: 'list',
        data: { title: 'Analyse' },
        loadComponent: () => import('./modules/analyzed-bill/analyzed-bill-list.component').then(m => m.AnalyzedBillListComponent)
      },
      {
        path: 'create',
        data: { title: 'Rechnung hochladen' },
        loadComponent: () => import('./modules/add-bill-for-analysis/add-bill-for-analysis.component').then(m => m.AddBillForAnalysisComponent)
      },
      {
        path: ':id',
        data: { title: 'Analysierte Rechnung', back: '/analyzed/list' },
        loadComponent: () => import('./modules/analyzed-bill-details/analyzed-bill-details.component').then(m => m.AnalyzedBillDetailsComponent)
      }
    ]
  }
];
