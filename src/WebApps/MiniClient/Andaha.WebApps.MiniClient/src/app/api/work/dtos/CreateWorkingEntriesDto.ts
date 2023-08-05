export interface CreateWorkingEntriesDto {
  personIds: string[],
  from: Date,
  until: Date,
  break: string,
  notes?: string
}
