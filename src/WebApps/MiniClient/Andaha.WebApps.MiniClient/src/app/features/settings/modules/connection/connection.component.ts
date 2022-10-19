import { Component, OnInit } from '@angular/core';
import { AddConnectionDialogService } from './add-connection-dialog/add-connection-dialog.service';

@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.scss']
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
