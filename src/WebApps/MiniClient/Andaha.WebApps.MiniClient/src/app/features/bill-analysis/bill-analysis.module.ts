import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
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
        loadChildren: () => import('./modules/analyzed-bill/analyzed-bill-list.module').then(m => m.AnalyzedBillListModule)
      },
      {
        path: 'create',
        loadChildren: () => import('./modules/add-bill-for-analysis/add-bill-for-analysis.module').then(m => m.AddBillForAnalysisModule)
      }
      ,
      {
        path: ':id',
        loadChildren: () => import('./modules/analyzed-bill-details/analyzed-bill-details.module').then(m => m.AnalyzedBillDetailsModule)
      }
    ]
  }
];

@NgModule({
  declarations: [BillAnalysisComponent],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
  ],
  exports: [RouterModule]
})
export class BillAnalysisModule { }
