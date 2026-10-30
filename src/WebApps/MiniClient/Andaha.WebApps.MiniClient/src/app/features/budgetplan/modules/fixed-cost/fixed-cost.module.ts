import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FixedCostComponent } from './fixed-cost.component';
import { RouterModule, Routes } from '@angular/router';
import { FixedCostListComponent } from './fixed-cost-list/fixed-cost-list.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const routes: Routes = [
  {
    path: '',
    data: { title: 'Fixkosten' },
    component: FixedCostComponent
  },
  {
    path: 'create',
    data: { title: 'Fixkosten hinzufügen', back: '/budgetplan/fixedcost' },
    loadChildren: () => import('./create-fixed-cost/create-fixed-cost.module').then(m => m.CreateFixedCostModule)
  },
  {
    path: ':id',
    data: { title: 'Fixkosten', back: '/budgetplan/fixedcost' },
    loadChildren: () => import('./fixed-cost-details/fixed-cost-details.module').then(m => m.FixedCostDetailsModule)
  }
];

@NgModule({
  declarations: [ FixedCostComponent, FixedCostListComponent ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class FixedCostModule { }
