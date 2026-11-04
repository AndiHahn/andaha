import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { AddConnectionDialogService } from './modules/connection/add-connection-dialog/add-connection-dialog.service';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIcon]
})
export class SettingsComponent implements OnInit {
  private addConnectionDialogFactory = inject(AddConnectionDialogService);


  ngOnInit(): void {
  }

  onAddConnectionClick(): void {
    this.addConnectionDialogFactory.openDialog().then(dialogRef => {
      dialogRef.afterClosed().subscribe();
    });
  }
}
