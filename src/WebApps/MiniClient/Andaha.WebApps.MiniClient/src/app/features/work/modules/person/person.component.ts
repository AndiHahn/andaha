import { Component, OnInit } from '@angular/core';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { PersonContextService } from '../../services/person-context.service';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit {

  persons?: PersonDto[];

  constructor(private personContextService: PersonContextService) { }

  ngOnInit(): void {
    this.initSubscriptions();
  }
  
  private initSubscriptions(): void {
    this.personContextService.persons().subscribe(
      {
        next: persons => this.persons = persons
      }
    );
  }
}
