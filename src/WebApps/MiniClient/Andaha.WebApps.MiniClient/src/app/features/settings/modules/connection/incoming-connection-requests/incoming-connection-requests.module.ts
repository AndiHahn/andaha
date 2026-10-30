import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomingConnectionRequestsComponent } from './incoming-connection-requests.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    IncomingConnectionRequestsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  exports: [ IncomingConnectionRequestsComponent ]
})
export class IncomingConnectionRequestsModule { }
