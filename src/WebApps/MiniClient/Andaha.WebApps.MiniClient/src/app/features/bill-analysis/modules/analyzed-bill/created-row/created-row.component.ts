import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AutoCreatedBillDto } from 'src/app/api/shopping/dtos/AutoCreatedBillDto';

/** Zeile unter „Angelegt“: heute automatisch angelegte Rechnung; Tipp öffnet sie, „Erledigt“ blendet sie aus */
@Component({
  selector: 'app-created-row',
  templateUrl: './created-row.component.html',
  styleUrls: ['./created-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, MatIcon, DatePipe, DecimalPipe]
})
export class CreatedRowComponent {
  readonly bill = input.required<AutoCreatedBillDto>();
  /** gerade fertig analysiert: kurz hervorheben (wie die neue Zeile in der Rechnungsliste) */
  readonly isNew = input(false);

  readonly done = output<void>();
}
