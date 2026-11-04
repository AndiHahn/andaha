import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { PersonContextService } from '../../services/person-context.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PersonListComponent } from './person-list/person-list.component';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-person',
    templateUrl: './person.component.html',
    styleUrls: ['./person.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [MatProgressSpinner, PersonListComponent, RouterLink, MatIcon]
})
export class PersonComponent implements OnInit {
  private personContextService = inject(PersonContextService);


  persons?: PersonDto[];

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
