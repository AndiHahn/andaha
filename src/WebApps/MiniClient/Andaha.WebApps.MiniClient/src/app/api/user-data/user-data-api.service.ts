import { Injectable, inject } from '@angular/core';
import { Observable, concat, map, toArray } from 'rxjs';
import { BudgetPlanApiService } from '../budgetplan/budgetplan-api.service';
import { CollaborationApiService } from '../collaboration/collaboration-api.service';
import { BillApiService } from '../shopping/bill-api.service';
import { PersonApiService } from '../work/person-api.service';

/** „Benutzerdaten löschen“ (AC31) über alle Dienste */
@Injectable({
  providedIn: 'root'
})
export class UserDataApiService {
  private billApiService = inject(BillApiService);
  private budgetPlanApiService = inject(BudgetPlanApiService);
  private personApiService = inject(PersonApiService);
  private collaborationApiService = inject(CollaborationApiService);

  /**
   * Löscht nacheinander Rechnungen, Haushalt, Stunden und zuletzt die Verbindungen (design §6.4).
   * Bricht beim ersten Fehler ab; jeder Schritt ist im Backend idempotent und damit wiederholbar.
   * Der Aufrufer zeigt bei Fehlern eine eigene Meldung (SKIP_GLOBAL_ERROR).
   */
  deleteAll(): Observable<void> {
    return concat(
      this.billApiService.deleteUserData(),
      this.budgetPlanApiService.deleteUserData(),
      this.personApiService.deleteUserData(),
      this.collaborationApiService.deleteUserData()
    ).pipe(
      toArray(),
      map(() => undefined)
    );
  }
}
