import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { AddConnectionDialogService } from './modules/connection/add-connection-dialog/add-connection-dialog.service';
import { RouterOutlet } from '@angular/router';

// Bereich „Mehr“ (keine Tabs); die Unterseiten erreicht man über die Mehr-Seite bzw. die Desktop-Sidebar
@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet]
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
