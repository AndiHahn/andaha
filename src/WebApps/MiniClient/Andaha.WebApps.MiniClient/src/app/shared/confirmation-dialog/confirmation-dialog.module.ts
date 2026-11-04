import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { DialogModule } from '../dialog/dialog.module';

@NgModule({
    imports: [
        CommonModule,
        MatIconModule,
        MatDialogModule,
        DialogModule,
        ConfirmationDialogComponent
    ],
    exports: [
        ConfirmationDialogComponent
    ]
})
export class ConfirmationDialogModule { }
