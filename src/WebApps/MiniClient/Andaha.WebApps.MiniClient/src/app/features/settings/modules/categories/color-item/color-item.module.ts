import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorItemComponent } from './color-item.component';

@NgModule({
    imports: [
        CommonModule,
        ColorItemComponent
    ],
    exports: [
        ColorItemComponent
    ]
})
export class ColorItemModule { }
