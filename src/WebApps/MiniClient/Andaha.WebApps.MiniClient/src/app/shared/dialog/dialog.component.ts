import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogTitle, MatDialogClose } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatDialogTitle, MatDialogClose, MatIcon]
})
export class DialogComponent {
  @Input() title?: string;
}
