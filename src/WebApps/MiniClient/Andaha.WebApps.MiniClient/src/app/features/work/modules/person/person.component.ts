import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PersonDto } from 'src/app/api/work/dtos/PersonDto';
import { PersonContextService } from '../../services/person-context.service';
import { LoadState, LoadStateComponent } from 'src/app/shared/load-state/load-state.component';
import { PersonListComponent } from './person-list/person-list.component';
import { Router, RouterLink } from '@angular/router';
import { PageTitleService } from 'src/app/core/page-title/page-title.service';
import { MatIcon } from '@angular/material/icon';
import { MatFabButton } from '@angular/material/button';

@Component({
    selector: 'app-person',
    templateUrl: './person.component.html',
    styleUrls: ['./person.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [LoadStateComponent, PersonListComponent, RouterLink, MatIcon, MatFabButton]
})
export class PersonComponent implements OnInit, OnDestroy {
  private personContextService = inject(PersonContextService);
  private pageTitleService = inject(PageTitleService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly contextError = this.personContextService.error;

  persons?: PersonDto[];

  get loadState(): LoadState {
    if (this.contextError()) {
      return 'error';
    }
    if (!this.persons) {
      return 'loading';
    }

    return this.persons.length == 0 ? 'empty' : 'ready';
  }

  ngOnInit(): void {
    this.initSubscriptions();

    // „Person hinzufügen“ als Icon in der Kopfzeile, der FAB ist für Arbeitszeiten (Design US-0007)
    this.pageTitleService.setAction({ icon: 'person_add', label: 'Person hinzufügen', run: () => this.router.navigateByUrl('/work/person/create') });
  }

  ngOnDestroy(): void {
    this.pageTitleService.setAction(null);
  }

  retry(): void {
    this.personContextService.retry();
  }
  
  private initSubscriptions(): void {
    this.personContextService.persons().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: persons => this.persons = persons
      }
    );
  }
}
