import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OutgoingConnectionRequestsComponent } from './outgoing-connection-requests.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    OutgoingConnectionRequestsComponent
  ],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
  ],
  exports: [ OutgoingConnectionRequestsComponent ]
})
export class OutgoingConnectionRequestsModule { }
