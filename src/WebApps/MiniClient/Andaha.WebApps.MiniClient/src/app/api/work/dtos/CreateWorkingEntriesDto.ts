import { Time } from "@angular/common";

export interface CreateWorkingEntriesDto {
  personIds: string[],
  from: Date,
  until: Date,
  break: Time,
  notes?: string
}
