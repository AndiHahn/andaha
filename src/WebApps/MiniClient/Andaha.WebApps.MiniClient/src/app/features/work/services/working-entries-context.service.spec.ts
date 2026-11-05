import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, of, Subject } from 'rxjs';
import { WorkingEntryApiService } from 'src/app/api/work/working-entry-api.service';
import { WorkingEntryDto } from 'src/app/api/work/dtos/WorkingEntryDto';
import { WorkingEntryMonthsDto } from 'src/app/api/work/dtos/WorkingEntryMonthsDto';
import { WorkingEntriesContextService } from './working-entries-context.service';

describe('WorkingEntriesContextService', () => {
  let api: { listWorkingEntryMonths: ReturnType<typeof vi.fn>; deleteWorkingEntry: ReturnType<typeof vi.fn> };

  function entry(id: string, from: Date): WorkingEntryDto {
    return { id, from, until: new Date(from.getTime() + 60 * 60 * 1000), break: { hours: 0, minutes: 0 } };
  }

  function create(): WorkingEntriesContextService {
    TestBed.configureTestingModule({
      providers: [
        WorkingEntriesContextService,
        { provide: WorkingEntryApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'p-1' }, children: [], parent: null } } }
      ]
    });

    return TestBed.inject(WorkingEntriesContextService);
  }

  const november = entry('nov', new Date(2026, 10, 4, 7, 0));
  const october = entry('oct', new Date(2026, 9, 28, 7, 0));
  const september = entry('sep', new Date(2026, 8, 2, 7, 0));
  const july = entry('jul', new Date(2026, 6, 1, 7, 0));

  beforeEach(() => {
    api = { listWorkingEntryMonths: vi.fn(), deleteWorkingEntry: vi.fn() };
  });

  it('loads the newest 3 months first', async () => {
    api.listWorkingEntryMonths.mockReturnValue(of<WorkingEntryMonthsDto>({ entries: [november, october, september], nextUntil: '2026-08' }));

    const service = create();

    expect(api.listWorkingEntryMonths).toHaveBeenCalledWith('p-1', undefined, 3);
    expect(await firstValueFrom(service.workingEntries())).toEqual([november, october, september]);
    expect(service.hasOlder()).toBe(true);
  });

  it('"Ältere Monate laden" appends next months', async () => {
    api.listWorkingEntryMonths.mockReturnValueOnce(of<WorkingEntryMonthsDto>({ entries: [november, october, september], nextUntil: '2026-08' }));
    const service = create();

    api.listWorkingEntryMonths.mockReturnValueOnce(of<WorkingEntryMonthsDto>({ entries: [july], nextUntil: null }));
    service.loadOlder();

    expect(api.listWorkingEntryMonths).toHaveBeenLastCalledWith('p-1', '2026-08', 3);
    expect(await firstValueFrom(service.workingEntries())).toEqual([november, october, september, july]);
    expect(service.hasOlder()).toBe(false);
    expect(service.loadingOlder()).toBe(false);
  });

  it('marks loading older while the request runs and ignores a second click', () => {
    api.listWorkingEntryMonths.mockReturnValueOnce(of<WorkingEntryMonthsDto>({ entries: [november], nextUntil: '2026-10' }));
    const service = create();
    const older$ = new Subject<WorkingEntryMonthsDto>();
    api.listWorkingEntryMonths.mockReturnValueOnce(older$.asObservable());

    service.loadOlder();
    service.loadOlder();

    expect(service.loadingOlder()).toBe(true);
    expect(api.listWorkingEntryMonths).toHaveBeenCalledTimes(2);
  });

  it('refetch reloads as many months as are already shown', async () => {
    api.listWorkingEntryMonths.mockReturnValueOnce(of<WorkingEntryMonthsDto>({ entries: [november, october, september], nextUntil: '2026-08' }));
    const service = create();
    api.listWorkingEntryMonths.mockReturnValueOnce(of<WorkingEntryMonthsDto>({ entries: [july], nextUntil: '2026-06' }));
    service.loadOlder();

    api.listWorkingEntryMonths.mockReturnValueOnce(of<WorkingEntryMonthsDto>({ entries: [october, september, july], nextUntil: '2026-06' }));
    service.refetch();

    expect(api.listWorkingEntryMonths).toHaveBeenLastCalledWith('p-1', undefined, 4);
    expect(await firstValueFrom(service.workingEntries())).toEqual([october, september, july]);
  });

  it('sets the error state when the first load fails', () => {
    const failing$ = new Subject<WorkingEntryMonthsDto>();
    api.listWorkingEntryMonths.mockReturnValue(failing$.asObservable());
    const service = create();

    failing$.error(new Error('offline'));

    expect(service.error()).toBe(true);
  });
});
