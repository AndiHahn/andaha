import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatDialogTitle, MatDialogClose, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { SheetDragDirective } from 'src/app/core/overlay/sheet-drag.directive';

@Component({
    selector: 'app-dialog',
    templateUrl: './dialog.component.html',
    styleUrls: ['./dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatDialogTitle, MatDialogClose, MatIcon, SheetDragDirective]
})
export class DialogComponent {
  @Input() title?: string;

  /** Griff schließt den Dialog, wenn er mobil als Sheet erscheint (nur dort sichtbar) */
  readonly dialogRef = inject(MatDialogRef, { optional: true });
}
