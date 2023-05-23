import { Component, Input, OnInit } from '@angular/core';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { PersonContextService } from '../../../services/person-context.service';

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
}
