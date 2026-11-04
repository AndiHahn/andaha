import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { BillAnalysisComponent } from './bill-analysis.component';

const routes: Routes = [
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
        loadChildren: () => import('./modules/analyzed-bill/analyzed-bill-list.module').then(m => m.AnalyzedBillListModule)
      },
      {
        path: 'create',
        data: { title: 'Rechnung hochladen' },
        loadChildren: () => import('./modules/add-bill-for-analysis/add-bill-for-analysis.module').then(m => m.AddBillForAnalysisModule)
      }
      ,
      {
        path: ':id',
        data: { title: 'Analysierte Rechnung', back: '/analyzed/list' },
        loadChildren: () => import('./modules/analyzed-bill-details/analyzed-bill-details.module').then(m => m.AnalyzedBillDetailsModule)
      }
    ]
  }
];

@NgModule({
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        MatIconModule,
        BillAnalysisComponent
    ],
    exports: [RouterModule]
})
export class BillAnalysisModule { }
