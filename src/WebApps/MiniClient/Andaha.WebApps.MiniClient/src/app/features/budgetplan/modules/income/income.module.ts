import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomeComponent } from './income.component';
import { RouterModule, Routes } from '@angular/router';
import { IncomeListComponent } from './income-list/income-list.component';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

const routes: Routes = [
  {
    path: '',
    data: { title: 'Einkommen' },
    component: IncomeComponent
  },
  {
    path: 'create',
    data: { title: 'Einkommen hinzufügen', back: '/budgetplan/income' },
    loadChildren: () => import('./create-income/create-income.module').then(m => m.CreateIncomeModule)
  },
  {
    path: ':id',
    data: { title: 'Einkommen', back: '/budgetplan/income' },
    loadChildren: () => import('./income-details/income-details.module').then(m => m.IncomeDetailsModule)
  }
];

@NgModule({
  declarations: [ IncomeComponent, IncomeListComponent ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatProgressSpinnerModule
  ]
})
export class IncomeModule { }
