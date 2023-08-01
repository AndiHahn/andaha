import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { CreateWorkingEntriesDto } from 'src/app/api/work/dtos/CreateWorkingEntriesDto';
import { WorkingEntryApiService } from 'src/app/api/work/working-entry-api.service';

@Injectable({
  providedIn: 'root'
})
export class WorkingEntriesContextGlobalService {
  constructor(
    private apiService: WorkingEntryApiService
  ) { }

  createEntries(dto: CreateWorkingEntriesDto): Observable<void> {
    const returnSubject = new Subject<void>();

    this.apiService.createWorkingEntries(dto).subscribe(
      {
        next: _ => returnSubject.next(),
        error: error => returnSubject.error(error)
      }
    );

    return returnSubject.asObservable();
  }
}
