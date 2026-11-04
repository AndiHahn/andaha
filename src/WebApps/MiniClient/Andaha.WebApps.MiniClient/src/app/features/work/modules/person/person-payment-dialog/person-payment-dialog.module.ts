import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonPaymentDialogComponent } from './person-payment-dialog.component';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ShowErrorModule } from 'src/app/shared/form-field/show-error.module';

@NgModule({
    imports: [
        CommonModule,
        DialogModule,
        MatDialogModule,
        FormsModule,
        ReactiveFormsModule,
        MatIconModule,
        MatProgressSpinnerModule,
        ShowErrorModule,
        PersonPaymentDialogComponent
    ]
})
export class PersonPaymentDialogModule { }
