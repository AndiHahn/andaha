import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { DecimalPipe } from '@angular/common';
import { formatDuration } from '../../../functions/date-time-functions';
import { openAmount, openMinutes } from '../../../functions/payment-functions';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-person-list',
    templateUrl: './person-list.component.html',
    styleUrls: ['./person-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterLink, MatIcon, DecimalPipe]
})
export class PersonListComponent implements OnInit {

  @Input()
  persons!: PersonDto[];

  ngOnInit(): void {
    if (!this.persons) {
      throw new Error('Persons are required in order to use this component.');
    }
  }

  openHoursDisplayName(person: PersonDto): string {
    return formatDuration(openMinutes(person));
  }

  openAmount(person: PersonDto): number {
    return openAmount(person);
  }

  /** „Zahlung offen“, wenn der offene Betrag (auf Cent gerundet) über 0,00 € liegt (AC16) */
  isPaymentRequired(person: PersonDto): boolean {
    return openAmount(person) > 0;
  }
}
