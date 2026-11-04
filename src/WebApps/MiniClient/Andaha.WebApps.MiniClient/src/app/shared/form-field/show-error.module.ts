import { NgModule } from '@angular/core';
import { ShowErrorPipe } from './show-error.pipe';

@NgModule({
    imports: [ShowErrorPipe],
    exports: [ShowErrorPipe]
})
export class ShowErrorModule { }
