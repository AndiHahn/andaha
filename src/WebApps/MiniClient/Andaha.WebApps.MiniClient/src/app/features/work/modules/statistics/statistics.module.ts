import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatisticsComponent } from './statistics.component';
import { RouterModule, Routes } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { DatePickerFormFieldModule } from 'src/app/shared/date-picker/date-picker-form-field/date-picker-form-field.module';
import { TimerangeSelectionModule } from 'src/app/features/bill/modules/expenses/timerange-selection/timerange-selection.module';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { WorktimeComponent } from './worktime/worktime.component';

const routes: Routes = [
  {
    path: '',
    component: StatisticsComponent
  }
];

@NgModule({
  declarations: [
    StatisticsComponent,
    WorktimeComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatDividerModule,
    MatProgressSpinnerModule,
    DatePickerFormFieldModule,
    TimerangeSelectionModule
  ]
})
export class StatisticsModule { }
