import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActiveConnectionsComponent } from './active-connections.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [
    ActiveConnectionsComponent
  ],
  imports: [
    CommonModule,
    MatProgressSpinnerModule
  ],
  exports: [ ActiveConnectionsComponent ]
})
export class ActiveConnectionsModule { }
