import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FixedCostComponent } from './fixed-cost.component';
import { RouterModule, Routes } from '@angular/router';
import { FixedCostListComponent } from './fixed-cost-list/fixed-cost-list.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const routes: Routes = [
  {
    path: '',
    component: FixedCostComponent
  },
  {
    path: 'create',
    loadChildren: () => import('./create-fixed-cost/create-fixed-cost.module').then(m => m.CreateFixedCostModule)
  },
  {
    path: ':id',
    loadChildren: () => import('./fixed-cost-details/fixed-cost-details.module').then(m => m.FixedCostDetailsModule)
  }
];

@NgModule({
  declarations: [ FixedCostComponent, FixedCostListComponent ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class FixedCostModule { }
