import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OutgoingConnectionRequestsComponent } from './outgoing-connection-requests.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
    imports: [
        CommonModule,
        MatProgressSpinnerModule,
        OutgoingConnectionRequestsComponent,
    ],
    exports: [OutgoingConnectionRequestsComponent]
})
export class OutgoingConnectionRequestsModule { }
