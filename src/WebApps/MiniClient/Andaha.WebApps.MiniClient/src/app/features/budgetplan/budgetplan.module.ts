import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BudgetplanComponent } from './budgetplan.component';
import { MatIconModule } from '@angular/material/icon';
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
        data: { title: 'Haushaltsplan' },
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
    imports: [
        RouterModule.forChild(routes),
        CommonModule,
        MatIconModule,
        BudgetplanComponent
    ]
})
export class BudgetplanModule { }
