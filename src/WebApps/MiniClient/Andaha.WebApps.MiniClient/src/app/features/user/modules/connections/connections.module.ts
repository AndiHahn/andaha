import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionsComponent } from './connections.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [
    ConnectionsComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  exports: [ ConnectionsComponent ]
})
export class ConnectionsModule { }
