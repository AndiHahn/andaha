import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsComponent } from './statistics.component';
import { RouterModule, Routes } from '@angular/router';


import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorktimeComponent } from './worktime/worktime.component';

const routes: Routes = [
  {
    path: '',
    component: StatisticsComponent
  }
];

@NgModule({
    imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatProgressSpinnerModule,
    StatisticsComponent,
    WorktimeComponent
]
})
export class StatisticsModule { }
