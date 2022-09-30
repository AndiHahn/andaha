import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IncomingConnectionRequestsComponent } from './incoming-connection-requests.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [
    IncomingConnectionRequestsComponent
  ],
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  exports: [ IncomingConnectionRequestsComponent ]
})
export class IncomingConnectionRequestsModule { }
