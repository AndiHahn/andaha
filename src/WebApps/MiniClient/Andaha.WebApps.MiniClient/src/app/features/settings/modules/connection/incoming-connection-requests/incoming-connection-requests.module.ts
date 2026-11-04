import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomingConnectionRequestsComponent } from './incoming-connection-requests.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
    imports: [
        CommonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        IncomingConnectionRequestsComponent,
    ],
    exports: [IncomingConnectionRequestsComponent]
})
export class IncomingConnectionRequestsModule { }
