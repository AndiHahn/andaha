import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeComponent } from './income.component';
import { RouterModule, Routes } from '@angular/router';
import { IncomeListComponent } from './income-list/income-list.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const routes: Routes = [
  {
    path: '',
    component: IncomeComponent
  },
  {
    path: 'create',
    loadChildren: () => import('./create-income/create-income.module').then(m => m.CreateIncomeModule)
  },
  {
    path: ':id',
    loadChildren: () => import('./income-details/income-details.module').then(m => m.IncomeDetailsModule)
  }
];

@NgModule({
  declarations: [ IncomeComponent, IncomeListComponent ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class IncomeModule { }
