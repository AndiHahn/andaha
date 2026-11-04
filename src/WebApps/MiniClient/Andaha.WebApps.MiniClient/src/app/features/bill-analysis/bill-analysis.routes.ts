import { Routes } from '@angular/router';
import { BillAnalysisComponent } from './bill-analysis.component';

// Eingehängt unter /bill/analysis (bill.routes.ts)
export const routes: Routes = [
  {
    path: '',
    component: BillAnalysisComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        data: { title: 'Rechnungen' },
        loadComponent: () => import('./modules/analyzed-bill/analyzed-bill-list.component').then(m => m.AnalyzedBillListComponent)
      },
      {
        path: ':id',
        data: { title: 'Analysierte Rechnung', back: '/bill/analysis' },
        loadComponent: () => import('./modules/analyzed-bill-details/analyzed-bill-details.component').then(m => m.AnalyzedBillDetailsComponent)
      }
    ]
  }
];
