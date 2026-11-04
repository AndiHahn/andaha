import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerangeSelectionComponent } from './timerange-selection.component';
import { MatNativeDateModule, MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
    imports: [
        CommonModule,
        MatOptionModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        TimerangeSelectionComponent
    ],
    exports: [
        TimerangeSelectionComponent
    ]
})
export class TimerangeSelectionModule { }
