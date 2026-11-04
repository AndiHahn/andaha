import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AddConnectionDialogService } from './add-connection-dialog/add-connection-dialog.service';
import { ActiveConnectionsComponent } from './active-connections/active-connections.component';
import { MatIcon } from '@angular/material/icon';
import { IncomingConnectionRequestsComponent } from './incoming-connection-requests/incoming-connection-requests.component';
import { OutgoingConnectionRequestsComponent } from './outgoing-connection-requests/outgoing-connection-requests.component';

@Component({
    selector: 'app-connection',
    templateUrl: './connection.component.html',
    styleUrls: ['./connection.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [ActiveConnectionsComponent, MatIcon, IncomingConnectionRequestsComponent, OutgoingConnectionRequestsComponent]
})
export class ConnectionComponent implements OnInit {

  constructor(private addConnectionDialogFactory: AddConnectionDialogService) { }

  ngOnInit(): void {
  }

  onAddConnectionClick(): void {
    this.addConnectionDialogFactory.openDialog().then(dialogRef => {
      dialogRef.afterClosed().subscribe();
    });
  }
}
