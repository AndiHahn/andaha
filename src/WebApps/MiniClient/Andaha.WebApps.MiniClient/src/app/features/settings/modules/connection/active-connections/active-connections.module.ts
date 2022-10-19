import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActiveConnectionsComponent } from './active-connections.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@NgModule({
  declarations: [
    ActiveConnectionsComponent
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  exports: [ ActiveConnectionsComponent ]
})
export class ActiveConnectionsModule { }
