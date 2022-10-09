import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OutgoingConnectionRequestsComponent } from './outgoing-connection-requests.component';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    OutgoingConnectionRequestsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  exports: [ OutgoingConnectionRequestsComponent ]
})
export class OutgoingConnectionRequestsModule { }
