import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectionComponent } from './connection.component';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { IncomingConnectionRequestsModule } from './incoming-connection-requests/incoming-connection-requests.module';
import { OutgoingConnectionRequestsModule } from './outgoing-connection-requests/outgoing-connection-requests.module';
import { ActiveConnectionsModule } from './active-connections/active-connections.module';

const routes: Routes = [
  {
    path: '',
    component: ConnectionComponent,
  }
];

@NgModule({
  declarations: [
    ConnectionComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    IncomingConnectionRequestsModule,
    OutgoingConnectionRequestsModule,
    ActiveConnectionsModule
  ],
  providers: [
    
  ]
})
export class ConnectionModule { }
