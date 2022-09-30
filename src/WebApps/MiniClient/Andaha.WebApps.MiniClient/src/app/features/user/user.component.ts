import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/auth.service';
import { AddConnectionDialogService } from './modules/add-connection-dialog/add-connection-dialog.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private addConnectionDialogFactory: AddConnectionDialogService) { }

  ngOnInit(): void {
  }

  onLogoutClick(): void {
    this.authService.logout();
  }

  onAddConnectionClick(): void {
    this.addConnectionDialogFactory.openDialog().then(dialogRef => {
      dialogRef.afterClosed().subscribe();
    });
  }
}
