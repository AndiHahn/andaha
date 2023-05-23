export interface CreateWorkingEntriesDto {
  personIds: string[],
  from: Date,
  until: Date,
  break: Date,
  notes?: string
}
