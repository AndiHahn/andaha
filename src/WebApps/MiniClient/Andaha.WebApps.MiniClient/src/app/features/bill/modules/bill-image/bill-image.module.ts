import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillImageComponent } from './bill-image.component';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
    imports: [
        CommonModule,
        MatIconModule,
        BillImageComponent
    ],
    exports: [
        BillImageComponent
    ]
})
export class BillImageModule { }
