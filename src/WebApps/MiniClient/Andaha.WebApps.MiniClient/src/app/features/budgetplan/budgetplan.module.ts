import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetplanComponent } from './budgetplan.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full'
  },
  {
    path: '',
    component: BudgetplanComponent,
    children: [
      {
        path: 'overview',
        loadChildren: () => import('./modules/overview/overview.module').then(m => m.OverviewModule)
      },
      {
        path: 'fixedcost',
        loadChildren: () => import('./modules/fixed-cost/fixed-cost.module').then(m => m.FixedCostModule)
      },
      {
        path: 'income',
        loadChildren: () => import('./modules/income/income.module').then(m => m.IncomeModule)
      }
    ]
  }
];

@NgModule({
  declarations: [
    BudgetplanComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatToolbarModule
  ]
})
export class BudgetplanModule { }
