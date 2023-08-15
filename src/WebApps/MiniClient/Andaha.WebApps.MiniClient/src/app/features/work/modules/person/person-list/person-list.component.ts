import { Component, Input, OnInit } from '@angular/core';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { createTimeDisplayName } from '../../../functions/date-time-functions';
import { Time } from '@angular/common';

@Component({
  selector: 'app-person-list',
  templateUrl: './person-list.component.html',
  styleUrls: ['./person-list.component.scss']
})
export class PersonListComponent implements OnInit {

  @Input()
  persons!: PersonDto[];

  constructor() { }

  ngOnInit(): void {
    if (!this.persons) {
      throw new Error('Persons are required in order to use this component.');
    }
  }

  getTimeDisplayName(time: Time): string {
    return createTimeDisplayName(time);
  }

  isPaymentRequired(person: PersonDto): boolean {
    return person.hourlyRate > 0 &&
      (person.totalHours.hours != person.payedHours.hours ||
      person.totalHours.minutes != person.payedHours.minutes);
  }
}
