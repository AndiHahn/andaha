import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddBillImageDialogComponent } from './add-bill-image-dialog.component';
import { DialogModule } from 'src/app/shared/dialog/dialog.module';
import { MatDialogModule } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio'
import { MatIconModule } from '@angular/material/icon';

@NgModule({
    imports: [
        CommonModule,
        DialogModule,
        MatDialogModule,
        MatRadioModule,
        MatIconModule,
        AddBillImageDialogComponent
    ]
})
export class AddBillImageDialogModule { }
