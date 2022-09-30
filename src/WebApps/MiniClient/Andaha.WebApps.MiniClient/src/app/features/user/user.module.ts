import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { UserComponent } from './user.component';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddConnectionDialogService } from './modules/add-connection-dialog/add-connection-dialog.service';
import { IncomingConnectionRequestsModule } from './modules/incoming-connection-requests/incoming-connection-requests.module';
import { ConnectionsModule } from './modules/connections/connections.module';
import { OutgoingConnectionRequestsModule } from './modules/outgoing-connection-requests/outgoing-connection-requests.module';

const routes: Routes = [
  {
    path: '',
    component: UserComponent
  }
];

@NgModule({
  declarations: [
    UserComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatDialogModule,
    IncomingConnectionRequestsModule,
    OutgoingConnectionRequestsModule,
    ConnectionsModule
  ],
  exports: [ RouterModule ],
  providers: [
    AddConnectionDialogService,
    {
      provide: 'dialog',
      useValue: MatDialog
    }
  ]
})
export class UserModule { }