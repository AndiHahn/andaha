import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { firstValueFrom, of } from 'rxjs';
import { HeaderAction, PageTitleService } from 'src/app/core/page-title/page-title.service';
import { PersonContextService } from '../../services/person-context.service';
import { PersonComponent } from './person.component';

describe('PersonComponent', () => {
  let fixture: ComponentFixture<PersonComponent>;
  let actions: (HeaderAction | null)[];

  beforeEach(async () => {
    actions = [];

    await TestBed.configureTestingModule({
      imports: [PersonComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: PersonContextService, useValue: { persons: () => of([]) } },
        { provide: PageTitleService, useValue: { setAction: (action: HeaderAction | null) => actions.push(action) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PersonComponent);
    fixture.detectChanges();
  });

  it('offers "Person hinzufügen" as header action', () => {
    const action = actions.at(-1)!;
    expect(action.icon).toBe('person_add');
    expect(action.label).toBe('Person hinzufügen');

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    action.run();
    expect(navigate).toHaveBeenCalledWith('/work/person/create');
  });

  it('clears the header action when leaving the page', () => {
    fixture.destroy();
    expect(actions.at(-1)).toBeNull();
  });

  it('has a FAB for adding working hours instead of an action bar', () => {
    const fab: HTMLAnchorElement = fixture.nativeElement.querySelector('a[mat-fab]');
    expect(fab.getAttribute('aria-label')).toBe('Arbeitszeiten hinzufügen');
    expect(fab.getAttribute('href')).toBe('/create-working-entry');
    expect(fixture.nativeElement.querySelector('.actions')).toBeNull();
  });
});

// Mit echtem Router und PageTitleService: die Shell setzt die Aktion bei NavigationEnd zurück,
// die Seite muss sie danach setzen.
describe('PersonComponent in the router', () => {
  it('keeps the header action after the navigation to the page has ended', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'work/person', component: PersonComponent }]),
        { provide: PersonContextService, useValue: { persons: () => of([]) } }
      ]
    });
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/work/person');

    const action = await firstValueFrom(TestBed.inject(PageTitleService).action$);
    expect(action?.icon).toBe('person_add');
  });
});
