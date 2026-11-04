import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogComponent } from './dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
    imports: [
        CommonModule,
        MatIconModule,
        MatDialogModule,
        DialogComponent
    ],
    exports: [
        DialogComponent
    ]
})
export class DialogModule { }
